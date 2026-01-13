import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiInbox, HiBell, HiTrash } from 'react-icons/hi';
import { fetchMyGigs, deleteGig } from '../store/slices/gigSlice';
import { fetchMyBids } from '../store/slices/bidSlice';
import Card from '../components/Card';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { myGigs, isLoading: gigsLoading, error: gigsError } = useSelector((state) => state.gigs);
  const { myBids, isLoading: bidsLoading } = useSelector((state) => state.bids);
  const { notifications } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth); // Get current user

  const [activeTab, setActiveTab] = useState('gigs');
  const [deletingGigId, setDeletingGigId] = useState(null);

  // Refetch data when user changes (important for account switching)
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchMyGigs());
      dispatch(fetchMyBids());
    }
  }, [dispatch, user?._id]); // Refetch when user ID changes

  const handleDeleteGig = async (gigId, gigTitle) => {
    if (window.confirm(`Are you sure you want to delete "${gigTitle}"? This action cannot be undone.`)) {
      setDeletingGigId(gigId);
      const result = await dispatch(deleteGig(gigId));
      setDeletingGigId(null);
      
      if (deleteGig.fulfilled.match(result)) {
        // Successfully deleted - myGigs will be updated automatically by Redux
      } else {
        alert(result.payload || 'Failed to delete gig');
      }
    }
  };

  const tabs = [
    { id: 'gigs', label: 'My Gigs', count: myGigs.length },
    { id: 'bids', label: 'My Bids', count: myBids.length },
    { id: 'notifications', label: 'Notifications', count: notifications.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Dashboard</h1>
        <p className="text-gray-400">Manage your gigs, bids, and notifications</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-dark-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-accent-teal text-accent-teal'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {activeTab === 'gigs' && (
        <div>
          {gigsLoading ? (
            <div className="flex justify-center py-20">
              <Loading size="lg" />
            </div>
          ) : myGigs.length === 0 ? (
            <Card>
              <EmptyState
                message="You haven't posted any gigs yet"
                icon={HiInbox}
              />
              <div className="flex justify-center mt-6">
                <Link to="/gigs/create">
                  <Button variant="primary">Post Your First Gig</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGigs.map((gig, index) => (
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
                      <button
                        onClick={() => handleDeleteGig(gig._id, gig.title)}
                        disabled={deletingGigId === gig._id}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete gig"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-100 mb-2">{gig.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{gig.description}</p>

                    <div className="mb-4">
                      <p className="text-2xl font-bold text-accent-teal">${gig.budget}</p>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/gigs/${gig._id}`} className="flex-1">
                        <Button variant="primary" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bids' && (
        <div>
          {bidsLoading ? (
            <div className="flex justify-center py-20">
              <Loading size="lg" />
            </div>
          ) : myBids.length === 0 ? (
            <Card>
              <EmptyState message="You haven't submitted any bids yet" icon={HiInbox} />
            </Card>
          ) : (
            <div className="space-y-4">
              {myBids.map((bid, index) => (
                <motion.div
                  key={bid._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Link to={`/gigs/${bid.gigId._id}`}>
                          <h3 className="text-xl font-semibold text-gray-100 hover:text-accent-teal transition-colors mb-2">
                            {bid.gigId.title}
                          </h3>
                        </Link>
                        <p className="text-gray-400 text-sm mb-2">Budget: ${bid.gigId.budget}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent-teal mb-2">${bid.price}</p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bid.status === 'hired'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : bid.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                          }`}
                        >
                          {bid.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4">{bid.message}</p>

                    <Link to={`/gigs/${bid.gigId._id}`}>
                      <Button variant="outline" size="sm">
                        View Gig
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div>
          {notifications.length === 0 ? (
            <Card>
              <EmptyState message="No notifications yet" icon={HiBell} />
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className={notification.read ? 'opacity-60' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-100 font-medium mb-1">{notification.message}</p>
                        {notification.gigTitle && (
                          <Link
                            to={`/gigs/${notification.gigId}`}
                            className="text-accent-teal hover:text-accent-cyan text-sm"
                          >
                            View Gig: {notification.gigTitle}
                          </Link>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-accent-teal rounded-full ml-4"></div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
