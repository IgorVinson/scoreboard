import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import { Line } from 'react-chartjs-2';
  
  // Реєстрація компонентів Chart.js
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  );
  
  
  
  const ChartBlock = ({ reports, objectives}) => {
// console.log(reports);
// console.log(objectives);

    
    // Функція для отримання значення CSS-змінної
    const getCSSVariable = (variableName: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
      };
       // Використання
       const foregroundColor = getCSSVariable('--foreground');
       const borderColor = getCSSVariable('--border');
       const backgroundColor = getCSSVariable('--background');

       const getMetricNameById = (metricId) => {
        for (const objective of objectives) {
          for (const metric of objective.metrics) {
            if (metric.id === metricId) {
              return metric.name; // Повертаємо назву метрики
            }
          }
        }
        return metricId; // Якщо назва не знайдена, повертаємо сам id
      };

    

      const [selectedMetric, setSelectedMetric] = useState('');

      const metrics = Array.from(
        new Set(
          reports.flatMap(report => Object.keys(report.metrics_data))
        )
      );

      
     
    // Данні для графіка

    const uniqueDates = [...new Set(reports.map(report => report.date))].sort();
    
    const planData = uniqueDates.map(date =>
       reports
      .filter(report => report.date === date)
      .reduce((sum, report) => {
        const metric = report.metrics_data[selectedMetric];
        return sum + (metric?.plan || 0);
      }, 0)
  );
  
  const factData = uniqueDates.map(date =>
    reports
      .filter(report => report.date === date)
      .reduce((sum, report) => {
        const metric = report.metrics_data[selectedMetric];
        return sum + (metric?.fact || 0);
      }, 0)
  );

    const data = {
      labels: uniqueDates,
      datasets: [
        {
        label: 'Plan',
        data: planData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 4,
        fill: false,
        },
        {
        label: 'Fact',
        data: factData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 4,
        fill: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
         display: true, 
         labels: {
          usePointStyle: true,
          pointStyle: 'line',
         }
        },
      },
      scales: {
        x: {
          ticks: {
            color: `hsl(${foregroundColor})`, // Колір підписів осі X
          },
          grid: {
            color: `hsl(${borderColor})`, // Колір сітки осі X
          },
        },
        y: {
          ticks: {
            color: `hsl(${foregroundColor})`, // Колір підписів осі Y
          },
          grid: {
            color: `hsl(${borderColor})`, // Колір сітки осі Y
          },
        },
      },
    };
  
    return (
      <div className="p-6 bg-card text-card-foreground rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Performance Chart</h3>
       {/* Випадаючий список для вибору метрики */}
       <div className="mb-4">
        <label htmlFor="metric-select" className="block text-sm font-medium text-gray-700" style={{ color: `hsl(${foregroundColor})` }}>
          Select Metric:
        </label>
        <select
          id="metric-select"
          value={selectedMetric}
          onChange={e => setSelectedMetric(e.target.value)}
          className="mt-1 block w-2/5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          style={{ backgroundColor: `hsl(${backgroundColor})` }}
        >
          <option value="" style={{ color: `hsl(${foregroundColor})` }}>Select a metric</option>
          {metrics.map(metricId => (
            <option key={metricId} value={metricId}>
               {getMetricNameById(metricId)}
            </option>
          ))}
        </select>
      </div>

      {/* Графік */}
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
    );
  };
  
  export default ChartBlock;