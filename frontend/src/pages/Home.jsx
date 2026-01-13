import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { HiBriefcase, HiCurrencyDollar, HiLightningBolt } from 'react-icons/hi';
import Button from '../components/Button';
import Card from '../components/Card';

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-100 mb-6">
            Find Your Next
            <span className="bg-gradient-to-r from-accent-teal to-accent-cyan bg-clip-text text-transparent">
              {' '}Gig
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Connect clients with talented freelancers. Post jobs, submit bids, and build amazing projects together.
          </p>
          <div className="flex justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/gigs">
                  <Button variant="primary" size="lg">
                    Browse Gigs
                  </Button>
                </Link>
                <Link to="/gigs/create">
                  <Button variant="outline" size="lg">
                    Post a Gig
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <div className="mb-4">
                <HiBriefcase size={48} className="text-accent-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Post Jobs</h3>
              <p className="text-gray-400">
                Need work done? Post your project and get bids from skilled freelancers.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <div className="mb-4">
                <HiCurrencyDollar size={48} className="text-accent-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Submit Bids</h3>
              <p className="text-gray-400">
                Browse available gigs and submit competitive bids to win projects.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <div className="mb-4">
                <HiLightningBolt size={48} className="text-accent-teal" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Real-time Updates</h3>
              <p className="text-gray-400">
                Get instant notifications when you're hired or when new bids arrive.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
