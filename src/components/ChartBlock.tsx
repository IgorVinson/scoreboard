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
  
  
  
  const ChartBlock = ({ reports}) => {
// console.log(reports);
    
    // Функція для отримання значення CSS-змінної
    const getCSSVariable = (variableName: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

      };
      
      // Використання
      const cardForeground = getCSSVariable('--card-foreground');
      const foregroundColor = getCSSVariable('--foreground');
      const borderColor = getCSSVariable('--border');
    // Данні для графіка

    const uniqueDates = [...new Set(reports.map(report => report.date))].sort();
    const planData = uniqueDates.map(date =>
      reports
        .filter(report => report.date === date) // Фільтруємо звіти за датою
        .reduce((sum, report) => {
          return (
            sum +
            Object.values(report.metrics_data).reduce(
              (metricSum, metric) => metricSum + (metric.plan || 0),
              0
            )
          );
        }, 0)
    );
  
    const factData = uniqueDates.map(date =>
      reports
        .filter(report => report.date === date) // Фільтруємо звіти за датою
        .reduce((sum, report) => {
          return (
            sum +
            Object.values(report.metrics_data).reduce(
              (metricSum, metric) => metricSum + (metric.fact || 0),
              0
            )
          );
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
        fill: false,
        },
        {
          label: 'Fact',
        data: factData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: `hsl(${cardForeground})`, // Колір тексту легенди
          },
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
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
    );
  };
  
  export default ChartBlock;