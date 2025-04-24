import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();

  const handlePurchaseClick = () => {
    navigate('/payment-redirect');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to MetricFlow</h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl">
          The ultimate analytics platform for tracking and visualizing your key metrics
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button size="lg" onClick={handlePurchaseClick} className="px-8">
            Purchase Now
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="px-8">
            Login
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">Real-time Dashboards</h3>
              <p className="text-muted-foreground">
                Monitor your metrics in real-time with beautiful and customizable dashboards.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Gain deep insights with our advanced analytics and reporting tools.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow">
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Share insights and collaborate with your team in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} MetricFlow. All rights reserved.</p>
      </footer>
    </div>
  );
} 