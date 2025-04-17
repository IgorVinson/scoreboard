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
    const data = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [
        {
          label: 'Performance',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
        },
      ],
    };
  
    const options = {
      responsive: true,
      maintainAspectRatio: false,
    };
  
    return (
      <div className='p-6 bg-white rounded-lg shadow-md'>
        <h3 className='text-lg font-semibold mb-4'>Performance Chart</h3>
        <div style={{ height: '300px' }}>
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };
  
  export default ChartBlock;