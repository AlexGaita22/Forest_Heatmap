# 🌲 Romanian Forestry Monitoring Dashboard

> Real-time geospatial visualization system for national forestry tracking and timber transport monitoring

<img width="1832" height="869" alt="image" src="https://github.com/user-attachments/assets/d6bb1ef0-b838-4120-b46d-ae844571d28a" />


<img width="1801" height="658" alt="image" src="https://github.com/user-attachments/assets/a27ac888-9d7f-47e3-a066-7c35901999c5" />


<img width="1837" height="874" alt="Screenshot 2025-12-14 155723" src="https://github.com/user-attachments/assets/3e05f11c-2d5f-4887-b755-56d0784c7896" />
<img width="1837" height="857" alt="Screenshot 2025-12-14 155412" src="https://github.com/user-attachments/assets/df5907a8-6197-4549-9cef-f6e06276f7d4" />
<img width="1858" height="871" alt="Screenshot 2025-12-14 155349" src="https://github.com/user-attachments/assets/6f9e6a74-fe64-457f-ae4e-f3c13818b0a6" />

---

## 📋 Overview

A data visualization platform built for environmental monitoring that processes and displays forestry data across Romania. The system provides interactive heatmaps showing:

- **Forestry density** by region
- **Timber transport routes** and volume
- **Hotspot analysis** for high-activity areas
- **Real-time data updates** from government APIs

Built for the Ministry of Environment to support policy decisions and resource allocation.

---

## ✨ Key Features

- 🗺️ **Interactive Heatmap** - Visual representation of forestry data across the country
- 📊 **Transport Analytics** - Track timber movement patterns and volumes
- 🎯 **Hotspot Detection** - Identify areas with highest activity
- 📈 **Trend Analysis** - Historical data visualization
- 🔄 **Real-time Updates** - Live data integration from government sources
- 📱 **Responsive Design** - Works on desktop and mobile

---

---

### Running the Application
```bash
open the index file 
```

Visit `http://localhost:5000` (or respective port) in your browser.

---

## 📊 Features in Detail

### 1. Forestry Density Heatmap
Visualizes the concentration of forestry areas across Romania using color-coded regions.
```
# Example: Generate heatmap
from forestry_viz import HeatmapGenerator

generator = HeatmapGenerator(data_source='api')
heatmap = generator.create_density_map(
    region='Romania',
    metric='forest_coverage'
)
```

### 2. Transport Route Tracking
Monitor timber transport patterns with volume and frequency analysis.

### 3. Regional Comparisons
Compare forestry metrics across different counties (județe) and regions.




---

## 📈 Data Pipeline
```
Raw Data → Cleaning → Validation → Processing → Visualization
   ↓          ↓           ↓            ↓            ↓
  API      Remove      Check       Aggregate    Generate
  Call    Duplicates  Integrity   by Region      Maps
```

---






## 📄 License

This project was developed under contract. Code samples shown are for demonstration purposes.

---

## 👤 Author

**Gaita Alexandru**

- 📧 Email: alexandrugaita2016@gmail.com

---

## 🙏 Acknowledgments

- Ministry of Environment for project requirements
- Romanian forestry data providers
- Open-source geospatial libraries community

---

## 📞 Contact

Interested in similar data visualization projects? Let's connect!


---

⭐ *If you find this project interesting, consider giving it a star!*
