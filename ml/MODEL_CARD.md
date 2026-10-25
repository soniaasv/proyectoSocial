# Ficha del modelo: detector de baches v1

| | |
|---|---|
| **Modelo** | YOLO11n (Ultralytics), 2.6 M de parámetros, una clase: `bache` |
| **Archivo** | `public/models/baches-yolo11n.onnx` (ONNX opset 17, 10.7 MB, entrada 640×640) |
| **Ejecución** | En el navegador del usuario con `onnxruntime-web` (WASM). La foto no sale del dispositivo |
| **Umbral** | 0.318: el que maximiza F1 en validación (`ml/calibrate.py`), leído por la app desde `src/data/modelo.json` |
| **Versión** | v1 · octubre 2026 · semilla 20261024 · entrenado en Apple M4 (MPS), 50 épocas |
| **Reproducir** | `uv run python prepare_data.py && uv run python train.py` |

## Uso previsto

- **Sí:** ayudar a un vecino a confirmar que su foto muestra un bache, y marcarlo en la imagen
- **No:** decidir si un reporte es válido. El detector **nunca bloquea un reporte** y **no participa en el índice de prioridad**
- **No:** medir el tamaño o la profundidad del bache

## Datos

Cuatro conjuntos abiertos de Roboflow Universe, unidos en una sola clase:

| Fuente | Formato | Imágenes | Licencia |
|---|---|---|---|
| `Ryukijano/Pothole-detection-Yolov8` (Potholes Detection v1, project-ssayl) | YOLO | 300 | CC BY 4.0 |
| `manot/pothole-segmentation` (road damage v3, abdulmohsen-fahad) | COCO | 819 | CC BY 4.0 |
| `manot/pothole-segmentation2` (pothole-detection v2, gurgen-hovsepyan) | COCO | 665 | CC BY 4.0 |
| `rupesh002/pothole-detection-dataset` (pothole v1) | YOLO | 715 | MIT |

**Fuga de información evitada.** Estos conjuntos se copian entre sí. Las fotos se agruparon por *hash* perceptual (dHash, Hamming ≤ 6), comparando también su versión espejo, porque Roboflow aumenta con volteos. **808 de 2,499 (32%) eran casi duplicados.** Los grupos completos se asignaron a un solo conjunto:

| Conjunto | Fotos | Cajas |
|---|---|---|
| Entrenamiento | 1,255 | 2,920 |
| Validación | 183 | 411 |
| Prueba | 253 | 575 |

Las cajas repetidas bajo clases "padre" e "hija" en las exportaciones COCO se eliminaron (IoU > 0.9). **Ninguna foto es de Navojoa ni de México.** Google Street View se descartó porque sus términos prohíben entrenar modelos con su contenido.

## Resultados

Prueba: 253 fotos nunca vistas, evaluadas una sola vez.

| Métrica | v0 (100 imágenes) | **v1 (1,255 imágenes)** |
|---|---|---|
| Precisión | 0.508 | **0.795** |
| Recall | 0.331 | **0.560** |
| mAP@0.5 | 0.350 | **0.683** |
| mAP@0.5:0.95 | 0.144 | **0.364** |

Comparación directa en las **mismas 92 fotos** del conjunto de prueba del v0: mAP@0.5 de 0.350 → **0.596**, recall de 0.331 → **0.564**.

Inferencia en el navegador (Apple M4, headless, WASM con un hilo): ~750–970 ms por foto. **Falta medirla en un Android de gama baja.**

**Cómo leerlo:** 4 de cada 5 baches que marca son correctos, y encuentra poco más de la mitad de los baches presentes. Es útil como ayuda, no como juez.

## Limitaciones y riesgos

- **Cambio de dominio:** Navojoa tiene terracería, topes, tapas de registro, polvo y luz intensa. Se amplió la aumentación de brillo y saturación, pero es probable que rinda peor que en la prueba
- Puede confundir parches recientes, charcos y manchas oscuras con baches
- El recall moderado significa que a veces dirá "no encontré un bache" cuando sí lo hay. Por eso la app nunca bloquea el reporte

## Plan para v2

1. Recolectar 500 o más fotos en Navojoa durante los recorridos de campo
2. Etiquetarlas (Sonia), incluyendo negativos difíciles: topes, tapas, parches y charcos
3. Partir el conjunto **por zona geográfica** y reportar métricas por tipo de calle y por nivel de marginación
4. Preentrenar con RDD2022 y cuantizar a FP16 o INT8 (3 a 5 MB)

## Licencia

Los pesos derivan de pesos preentrenados de Ultralytics y se distribuyen bajo **AGPL-3.0**. El código del proyecto es MIT. Datos de entrenamiento: CC BY 4.0 (Roboflow Universe, con atribución a sus autores) y MIT.
