import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiInbox } from 'react-icons/hi';
import { fetchGigs } from '../store/slices/gigSlice';
import Card from '../components/Card';
import Button from '../components/Button';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';

const GigFeed = () => {
  const { gigs, isLoading } = useSelector((state) => state.gigs);
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    dispatch(fetchGigs(''));
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    dispatch(fetchGigs(debouncedSearch));
  }, [debouncedSearch, dispatch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Browse Gigs</h1>
        <p className="text-gray-400">Find your next project opportunity</p>
      </div>

      <div className="mb-8">
        <Input
          type="text"
          placeholder="Search gigs by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loading size="lg" />
        </div>
      ) : gigs.length === 0 ? (
        <EmptyState message="No gigs found. Be the first to post one!" icon={HiInbox} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig, index) => (
            <motion.div
              key={gig._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gig.status === 'open'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                    }`}
                  >
                    {gig.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-100 mb-2">{gig.title}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{gig.description}</p>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="text-2xl font-bold text-accent-teal">${gig.budget}</p>
                  </div>
                </div>

                <Link to={`/gigs/${gig._id}`}>
                  <Button variant="primary" className="w-full">
                    View Details
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GigFeed;
