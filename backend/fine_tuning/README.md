# AutoTraderX — QLoRA Fine-Tuning

This directory contains scripts for fine-tuning a language model using QLoRA (Quantized Low-Rank Adaptation) to improve the AI financial advisor's accuracy and reduce hallucinations.

## Overview

- **`prepare_data.py`** — Generates training data from news articles and market context in Alpaca/chat format
- **`train_qlora.py`** — Runs QLoRA fine-tuning using PEFT, transformers, and bitsandbytes

## Requirements

These packages are needed **only on the training machine** (GPU required):

```bash
pip install peft transformers bitsandbytes datasets accelerate trl torch
```

## Quick Start

### 1. Prepare Training Data

```bash
# Generate training data from your backend's news/advisor pipeline
python prepare_data.py --output training_data.jsonl --num-samples 500

# Or use on Google Colab (upload the script and run)
```

### 2. Fine-Tune with QLoRA

```bash
python train_qlora.py \
    --base-model "meta-llama/Llama-3.2-3B-Instruct" \
    --data-path training_data.jsonl \
    --output-dir ./qlora_adapter \
    --epochs 3 \
    --lora-r 16 \
    --lora-alpha 32 \
    --learning-rate 2e-4
```

### 3. Google Colab

For GPU access, use Google Colab:
1. Upload `prepare_data.py` and `train_qlora.py` to Colab
2. Install dependencies: `!pip install peft transformers bitsandbytes datasets accelerate trl`
3. Run the training script with a T4/A100 GPU runtime

### 4. Using the Fine-Tuned Model

After training, the LoRA adapter weights are saved to `./qlora_adapter/`. You can:
- **Merge** the adapter into the base model for deployment
- **Load** the adapter at inference time using PEFT
- **Upload** to Hugging Face Hub for sharing

## Dataset Format

Training data uses the Alpaca instruction format:

```json
{
    "instruction": "Analyze the current market conditions for Bitcoin",
    "input": "BTC price: $42,500, 24h change: +2.3%, News sentiment: Bullish...",
    "output": "### 📈 Market Analysis: BTC\n- **Current Price**: $42,500..."
}
```
