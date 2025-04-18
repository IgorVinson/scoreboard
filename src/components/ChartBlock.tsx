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

    // Функція для отримання значення CSS-змінної
    const getCSSVariable = (variableName: string) => {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();

      };
      
      // Використання
      const cardForeground = getCSSVariable('--card-foreground');
      const foregroundColor = getCSSVariable('--foreground');
      const borderColor = getCSSVariable('--border');
      const chart2Color = getCSSVariable('--chart-2');
    // Данні для графіка


    const data = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [
        {
          label: 'Plan',
          data: [65, 59, 80, 81, 56, 55], // Дані для "Plan"
          fill: false,
          backgroundColor: `hsl(${borderColor})`, // Колір для точок
          borderColor: `hsl(${chart2Color})`, // Колір для лінії
        },
        {
          label: 'Fact',
          data: [70, 50, 75, 85, 60, 65], // Дані для "Fact"
          fill: false,
          backgroundColor: `hsl(${chart2Color})`, // Колір для точок
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
        <h3
  className="text-lg font-semibold mb-4"
  style={{ color: `hsl(${foregroundColor})` }}
>
  Performance Chart
</h3>
        <div style={{ height: '300px' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };
  
  export default ChartBlock;