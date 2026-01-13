import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { HiXCircle, HiInbox } from 'react-icons/hi';
import { fetchGig, clearCurrentGig } from '../store/slices/gigSlice';
import { fetchBidsByGig, createBid, hireFreelancer, clearBids, clearError } from '../store/slices/bidSlice';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';

const GigDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentGig, isLoading: gigLoading } = useSelector((state) => state.gigs);
  const { bids, isLoading: bidsLoading, error: bidError } = useSelector((state) => state.bids);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [showBidModal, setShowBidModal] = useState(false);
  const [showBids, setShowBids] = useState(false);
  const [bidData, setBidData] = useState({
    message: '',
    price: '',
  });

  // Authorization: Compare logged-in user ID with gig.ownerId
  // ALWAYS derive permissions from fresh backend data (currentGig)
  // NEVER rely on cached or stale Redux data
  // Gig owner CANNOT bid, Non-owners CAN bid
  // Gig owner CAN view bids, Non-owners CANNOT view bids
  const isOwner = currentGig && user && currentGig.ownerId?._id === user._id;
  const canBid = isAuthenticated && !isOwner && currentGig?.status === 'open';
  const canViewBids = isOwner;

  // Fetch fresh gig data on mount (ensures we have latest backend state)
  // This prevents stale cached data from showing wrong permissions
  useEffect(() => {
    dispatch(fetchGig(id));

    return () => {
      dispatch(clearCurrentGig());
      dispatch(clearBids());
    };
  }, [id, dispatch]);

  // Fetch bids when owner wants to view them
  // Only fetch if user is owner (authorization check)
  useEffect(() => {
    if (canViewBids && showBids) {
      dispatch(fetchBidsByGig(id));
    }
  }, [canViewBids, showBids, id, dispatch]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    // Validate price
    const price = parseFloat(bidData.price);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price (greater than 0)');
      return;
    }

    // Validate message
    if (!bidData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    const result = await dispatch(
      createBid({
        gigId: id,
        message: bidData.message.trim(),
        price: price,
      })
    );

    // Check if bid was created successfully
    if (createBid.fulfilled.match(result)) {
      setShowBidModal(false);
      setBidData({ message: '', price: '' });
      // Refresh gig details to show updated bid count
      dispatch(fetchGig(id));
    } else if (createBid.rejected.match(result)) {
      // Show error message
      alert(result.payload || 'Failed to submit bid');
    }
  };

  const handleHire = async (bidId) => {
    if (window.confirm('Are you sure you want to hire this freelancer?')) {
      await dispatch(hireFreelancer(bidId));
      dispatch(fetchBidsByGig(id));
      dispatch(fetchGig(id));
    }
  };

  if (gigLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-center py-20">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  if (!currentGig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState message="Gig not found" icon={HiXCircle} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentGig.status === 'open'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
              }`}
            >
              {currentGig.status.toUpperCase()}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-100 mb-4">{currentGig.title}</h1>
          <p className="text-gray-300 mb-6 whitespace-pre-wrap">{currentGig.description}</p>

          <div className="border-t border-dark-700 pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Budget</p>
                <p className="text-3xl font-bold text-accent-teal">${currentGig.budget}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Posted by</p>
                <p className="text-gray-300">{currentGig.ownerId.name}</p>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <div className="mt-6 flex gap-4">
              {/* Only show "Submit Bid" if user is NOT owner and gig is open */}
              {canBid && (
                <Button variant="primary" onClick={() => setShowBidModal(true)}>
                  Submit Bid
                </Button>
              )}
              {/* Only show "View Bids" if user IS owner */}
              {canViewBids && (
                <Button variant="secondary" onClick={() => setShowBids(!showBids)}>
                  {showBids ? 'Hide Bids' : 'View Bids'}
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Only show bids section if user is owner */}
        {canViewBids && showBids && (
          <Card>
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Bids ({bids.length})</h2>

            {bidsLoading ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : bids.length === 0 ? (
              <EmptyState message="No bids yet. Share this gig to get more applicants!" icon={HiInbox} />
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <Card key={bid._id} hover={false} className="!p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-100">{bid.freelancerId.name}</p>
                        <p className="text-sm text-gray-400">{bid.freelancerId.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-accent-teal">${bid.price}</p>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            bid.status === 'hired'
                              ? 'bg-green-500/20 text-green-400'
                              : bid.status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {bid.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 whitespace-pre-wrap">{bid.message}</p>

                    {currentGig.status === 'open' && bid.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleHire(bid._id)}
                      >
                        Hire This Freelancer
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}

        <Modal
          isOpen={showBidModal}
          onClose={() => {
            setShowBidModal(false);
            setBidData({ message: '', price: '' });
            dispatch(clearError());
          }}
          title="Submit a Bid"
        >
          <form onSubmit={handleBidSubmit} className="space-y-4">
            {bidError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
                {bidError}
              </div>
            )}

            <Input
              label="Your Price ($)"
              type="number"
              value={bidData.price}
              onChange={(e) => {
                setBidData({ ...bidData, price: e.target.value });
                dispatch(clearError());
              }}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={bidData.message}
                onChange={(e) => setBidData({ ...bidData, message: e.target.value })}
                placeholder="Tell the client why you're perfect for this project..."
                rows="6"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all duration-200 resize-none"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowBidModal(false);
                  setBidData({ message: '', price: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Submit Bid
              </Button>
            </div>
          </form>
        </Modal>
      </motion.div>
    </div>
  );
};

export default GigDetails;
