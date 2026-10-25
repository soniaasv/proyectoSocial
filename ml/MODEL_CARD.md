# Ficha del modelo: detector de baches v0

| | |
|---|---|
| **Modelo** | YOLO11n (Ultralytics), 2.6 M de parámetros, una clase: `bache` |
| **Archivo** | `public/models/baches-yolo11n.onnx` (ONNX opset 17, 10.7 MB, entrada 640×640) |
| **Ejecución** | En el navegador del usuario con `onnxruntime-web` (WASM). La foto no sale del dispositivo |
| **Versión** | v0 · octubre 2026 · semilla 20261024 |
| **Entrenamiento** | `ml/train.py` (reproducible con `uv run python train.py`) |

## Uso previsto

- **Sí:** ayudar a un vecino a confirmar que su foto muestra un bache, y marcarlo en la imagen
- **No:** decidir si un reporte es válido. El detector **nunca bloquea un reporte** y **no participa en el índice de prioridad**
- **No:** medir el tamaño o la profundidad del bache

## Datos

- **Fuente:** *Potholes Detection v1*, de Roboflow Universe (project-ssayl), con licencia **CC BY 4.0**, a través del espejo de Hugging Face `Ryukijano/Pothole-detection-Yolov8`
- **Tamaño:** 100 imágenes para entrenamiento, 100 para validación y 100 para prueba (el espejo publica 300 de las 13,767 originales)
- **Origen de las fotos:** calles de varios países, con predominio de autopistas y vías amplias. **Ninguna es de Navojoa ni de México**
- Se descartó Google Street View porque sus términos prohíben entrenar modelos con su contenido

## Resultados (conjunto de prueba, 100 imágenes nunca vistas)

| Métrica | Valor |
|---|---|
| Precisión | 0.508 |
| Recall | 0.331 |
| mAP@0.5 | 0.350 |
| mAP@0.5:0.95 | 0.144 |

Tiempo de inferencia medido en una laptop (Apple M4, navegador headless, un hilo WASM): ~750 ms por foto. **Falta medirlo en un Android de gama baja.**

**Cómo leerlo:** es un modelo débil. De cada 3 baches marcados, uno o dos son correctos, y encuentra 1 de cada 3 baches presentes. Como referencia, el mejor F1 del reto CRDDC2022 (47,420 imágenes) fue de 0.77. Con 100 imágenes de entrenamiento, este resultado es lo esperado.

## Limitaciones y riesgos

- **Cambio de dominio:** calles de Navojoa con terracería, topes, tapas de registro, tierra y luz intensa del desierto. Es probable que rinda peor que en la prueba
- Confunde parches recientes y manchas oscuras con baches (falsos positivos)
- Umbral de confianza usado en la app: 0.35 (NMS con IoU de 0.45)

## Plan para v1

1. Recolectar 500 o más fotos en Navojoa durante los recorridos de campo
2. Etiquetarlas (Sonia), incluyendo negativos difíciles: topes, tapas y parches
3. Preentrenar con RDD2022 y ajustar con las fotos locales; partir el conjunto **por zona geográfica**, para evitar fuga de información entre calles vecinas
4. Reportar métricas por tipo de calle (pavimentada y sin pavimentar) y por nivel de marginación
5. Cuantizar a FP16 o INT8 para bajar el tamaño a unos 3 a 5 MB

## Licencia

Los pesos derivan de pesos preentrenados de Ultralytics y se distribuyen bajo **AGPL-3.0**. El código del proyecto es MIT. Los datos de entrenamiento son CC BY 4.0, con atribución a Roboflow Universe (project-ssayl).
