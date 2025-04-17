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
  
  const ChartBlock = () => {
    // Отримання кольорів із CSS-змінних
    const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
    const chart1Color = getComputedStyle(document.documentElement).getPropertyValue('--chart-1').trim();
    const chart2Color = getComputedStyle(document.documentElement).getPropertyValue('--chart-2').trim();
  
    const data = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [
        {
          label: 'Performance',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          backgroundColor: `hsl(${chart1Color})`, // Колір для точок
          borderColor: `hsl(${chart2Color})`, // Колір для лінії
        },
      ],
    };
  
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: `hsl(${foregroundColor})`, // Колір тексту легенди
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
        <h3 className="text-lg font-semibold mb-4 text-primary-foreground">
          Performance Chart
        </h3>
        <div style={{ height: '300px' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };
  
  export default ChartBlock;