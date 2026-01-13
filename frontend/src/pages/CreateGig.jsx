import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { createGig } from '../store/slices/gigSlice';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const CreateGig = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.gigs);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(
      createGig({
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
      })
    );

    if (result.type === 'gigs/createGig/fulfilled') {
      navigate(`/gigs/${result.payload._id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <h1 className="text-3xl font-bold text-gray-100 mb-6">Post a New Gig</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Need a React developer for e-commerce site"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project in detail..."
                rows="8"
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:border-transparent transition-all duration-200 resize-none"
                required
              />
            </div>

            <Input
              label="Budget ($)"
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/gigs')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Post Gig'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateGig;
