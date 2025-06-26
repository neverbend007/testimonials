import React, { useState, useEffect } from 'react';
import { testimonialsAPI } from '../utils/api';
import StarRating from '../components/StarRating';
import { CheckCircle, XCircle, Star, Search, RefreshCw } from 'lucide-react';

const Testimonials = () => {
  const [pendingTestimonials, setPendingTestimonials] = useState([]);
  const [allTestimonials, setAllTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingResponse, allResponse] = await Promise.all([
        testimonialsAPI.getPending(),
        testimonialsAPI.getAll()
      ]);
      
      setPendingTestimonials(pendingResponse.data.testimonials);
      setAllTestimonials(allResponse.data.testimonials);
    } catch (error) {
      setError('Failed to load testimonials');
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!confirm('Are you sure you want to approve this testimonial?')) {
      return;
    }

    try {
      await testimonialsAPI.approve(id);
      setSuccess('Testimonial approved successfully');
      loadData();
    } catch (error) {
      setError('Failed to approve testimonial');
      console.error('Error approving testimonial:', error);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this testimonial?')) {
      return;
    }

    try {
      await testimonialsAPI.reject(id);
      setSuccess('Testimonial rejected successfully');
      loadData();
    } catch (error) {
      setError('Failed to reject testimonial');
      console.error('Error rejecting testimonial:', error);
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      await testimonialsAPI.updateFeatured(id, !currentFeatured);
      setSuccess(`Testimonial ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
      loadData();
    } catch (error) {
      setError('Failed to update featured status');
      console.error('Error updating featured status:', error);
    }
  };

  const filteredTestimonials = allTestimonials.filter(testimonial =>
    testimonial.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.testimonial_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testimonial.source_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTestimonials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTestimonials = filteredTestimonials.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-2">Loading testimonials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Testimonial Management</h1>
        <button
          onClick={loadData}
          className="btn btn-secondary"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      {/* Pending Testimonials */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">
            Pending Testimonials ({pendingTestimonials.length})
          </h2>
        </div>
        <div className="card-body">
          {pendingTestimonials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending testimonials</p>
          ) : (
            <div className="space-y-4">
              {pendingTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{testimonial.full_name}</h3>
                      <p className="text-sm text-gray-600">{testimonial.email}</p>
                      <StarRating rating={testimonial.star_rating} />
                    </div>
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                      {testimonial.source_type}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3 italic">"{testimonial.testimonial_text}"</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Submitted: {formatDate(testimonial.submitted_at)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(testimonial.id)}
                        className="btn btn-success"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(testimonial.id)}
                        className="btn btn-danger"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Testimonials */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">All Testimonials ({allTestimonials.length})</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search testimonials..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredTestimonials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No testimonials found</p>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{testimonial.full_name}</h3>
                        <StarRating rating={testimonial.star_rating} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {testimonial.source_type}
                        </span>
                        {testimonial.is_featured && (
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                            Featured
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${
                          testimonial.status === 'approved' 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {testimonial.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 italic">"{testimonial.testimonial_text}"</p>
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {testimonial.approved_at 
                          ? `Approved: ${formatDate(testimonial.approved_at)}`
                          : `Submitted: ${formatDate(testimonial.submitted_at)}`
                        }
                      </span>
                      {testimonial.status === 'approved' && (
                        <button
                          onClick={() => handleToggleFeatured(testimonial.id, testimonial.is_featured)}
                          className={`btn ${testimonial.is_featured ? 'btn-secondary' : 'btn-primary'} flex-shrink-0`}
                        >
                          <Star size={16} />
                          {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;