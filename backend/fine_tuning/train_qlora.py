"""
AutoTraderX — QLoRA Fine-Tuning Script

Fine-tunes a language model using QLoRA (4-bit quantization + LoRA adapters)
for improved financial advisory responses.

Requirements (GPU machine / Google Colab):
    pip install peft transformers bitsandbytes datasets accelerate trl torch

Usage:
    python train_qlora.py \
        --base-model meta-llama/Llama-3.2-3B-Instruct \
        --data-path training_data.jsonl \
        --output-dir ./qlora_adapter \
        --epochs 3
"""

import argparse
import json
import logging
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_dataset_from_jsonl(path: str) -> list:
    """Load training data from JSONL file."""
    data = []
    with open(path, "r") as f:
        for line in f:
            if line.strip():
                data.append(json.loads(line))
    logger.info("Loaded %d training samples from %s", len(data), path)
    return data


def format_prompt(sample: dict) -> str:
    """Format a training sample into the chat template."""
    instruction = sample["instruction"]
    context = sample.get("input", "")
    response = sample["output"]

    if context:
        prompt = (
            f"### Instruction:\n{instruction}\n\n"
            f"### Context:\n{context}\n\n"
            f"### Response:\n{response}"
        )
    else:
        prompt = (
            f"### Instruction:\n{instruction}\n\n"
            f"### Response:\n{response}"
        )

    return prompt


def main():
    parser = argparse.ArgumentParser(description="QLoRA Fine-Tuning for AutoTraderX")
    parser.add_argument("--base-model", type=str, default="meta-llama/Llama-3.2-3B-Instruct",
                        help="Base model name or path from Hugging Face")
    parser.add_argument("--data-path", type=str, default="training_data.jsonl",
                        help="Path to training data in JSONL format")
    parser.add_argument("--output-dir", type=str, default="./qlora_adapter",
                        help="Directory to save LoRA adapter weights")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=4, help="Per-device train batch size")
    parser.add_argument("--learning-rate", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--lora-r", type=int, default=16, help="LoRA rank")
    parser.add_argument("--lora-alpha", type=int, default=32, help="LoRA alpha")
    parser.add_argument("--lora-dropout", type=float, default=0.05, help="LoRA dropout")
    parser.add_argument("--max-seq-length", type=int, default=1024, help="Max sequence length")
    parser.add_argument("--gradient-accumulation-steps", type=int, default=4,
                        help="Gradient accumulation steps")
    parser.add_argument("--warmup-ratio", type=float, default=0.03, help="Warmup ratio")
    parser.add_argument("--logging-steps", type=int, default=10, help="Logging frequency")
    parser.add_argument("--save-steps", type=int, default=50, help="Checkpoint save frequency")
    parser.add_argument("--dry-run", action="store_true", help="Print config without training")
    args = parser.parse_args()

    config = {
        "base_model": args.base_model,
        "data_path": args.data_path,
        "output_dir": args.output_dir,
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.learning_rate,
        "lora_r": args.lora_r,
        "lora_alpha": args.lora_alpha,
        "lora_dropout": args.lora_dropout,
        "max_seq_length": args.max_seq_length,
        "gradient_accumulation_steps": args.gradient_accumulation_steps,
        "warmup_ratio": args.warmup_ratio,
    }

    logger.info("=" * 60)
    logger.info("AutoTraderX QLoRA Fine-Tuning Configuration")
    logger.info("=" * 60)
    for k, v in config.items():
        logger.info("  %s: %s", k, v)
    logger.info("=" * 60)

    if args.dry_run:
        logger.info("DRY RUN — printing config only, no training will occur.")
        # Validate data file exists
        if Path(args.data_path).exists():
            data = load_dataset_from_jsonl(args.data_path)
            logger.info("Sample formatted prompt:")
            logger.info(format_prompt(data[0])[:500] + "...")
        else:
            logger.warning("Data file not found: %s", args.data_path)
        return

    # ── Import heavy dependencies only when actually training ──
    try:
        import torch
        from datasets import Dataset
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            BitsAndBytesConfig,
            TrainingArguments,
        )
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from trl import SFTTrainer
    except ImportError as e:
        logger.error(
            "Missing dependencies for training. Install with:\n"
            "  pip install peft transformers bitsandbytes datasets accelerate trl torch\n"
            "Error: %s", e
        )
        return

    # ── Load Data ──
    raw_data = load_dataset_from_jsonl(args.data_path)
    formatted_data = [{"text": format_prompt(sample)} for sample in raw_data]
    dataset = Dataset.from_list(formatted_data)

    logger.info("Dataset size: %d samples", len(dataset))

    # ── Quantization Config (4-bit) ──
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # ── Load Base Model ──
    logger.info("Loading base model: %s", args.base_model)
    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    # ── Load Tokenizer ──
    tokenizer = AutoTokenizer.from_pretrained(args.base_model, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # ── LoRA Config ──
    lora_config = LoraConfig(
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=args.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
    )

    model = get_peft_model(model, lora_config)
    trainable_params, total_params = model.get_nb_trainable_parameters()
    logger.info(
        "Trainable parameters: %s / %s (%.2f%%)",
        f"{trainable_params:,}", f"{total_params:,}",
        100 * trainable_params / total_params,
    )

    # ── Training Arguments ──
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        weight_decay=0.001,
        warmup_ratio=args.warmup_ratio,
        logging_steps=args.logging_steps,
        save_steps=args.save_steps,
        save_total_limit=3,
        fp16=True,
        optim="paged_adamw_32bit",
        lr_scheduler_type="cosine",
        report_to="none",
        seed=42,
    )

    # ── Trainer ──
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        args=training_args,
        max_seq_length=args.max_seq_length,
        dataset_text_field="text",
        packing=False,
    )

    # ── Train! ──
    logger.info("Starting QLoRA fine-tuning...")
    trainer.train()

    # ── Save ──
    logger.info("Saving LoRA adapter to %s", args.output_dir)
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)

    # Save config for reference
    config_path = os.path.join(args.output_dir, "training_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    logger.info("✅ Fine-tuning complete! Adapter saved to: %s", args.output_dir)
    logger.info("To use the adapter, load it with PEFT:")
    logger.info("  from peft import PeftModel")
    logger.info("  model = PeftModel.from_pretrained(base_model, '%s')", args.output_dir)


if __name__ == "__main__":
    main()
