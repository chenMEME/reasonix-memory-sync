---
name: ocr
description: Run OCR on image files (screenshots, scanned docs) to extract Chinese/English text
---

# OCR — 图片文字提取

## 用法
```bash
python tools/ocr.py <图片路径> [--lang chi_sim+eng] [--mode raw|ui|doc]
```

### 模式选择
| 模式 | 适用场景 | 效果 |
|------|---------|------|
| `raw` | 原图直出（默认） | 不处理 |
| `ui` | UI截图、小字界面 | 放大2x + 去噪 + 二值化 + 锐化 |
| `doc` | 扫描件、拍照文档 | 灰度 + 去噪 + OTSU自动阈值 |

## 执行步骤
1. 检查图片文件是否存在
2. 根据图片类型选择 `--mode`
3. 运行 `python tools/ocr.py <图片路径> --mode <模式>`
4. 返回提取的文字结果

## 注意事项
- UI 截图用 `--mode ui` 效果最好
- 文档扫描件用 `--mode doc`
- Tesseract: 需提前安装 Tesseract-OCR 并配置 PATH
- 依赖 OpenCV (`cv2`) 和 NumPy