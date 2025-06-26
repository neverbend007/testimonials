import React, { useState, useEffect } from 'react';
import { testimonialsAPI } from '../utils/api';
import StarRating from '../components/StarRating';
import { CheckCircle, XCircle, Star, Search, RefreshCw, Filter, Clock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { cn } from '../lib/utils';

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
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to approve testimonial');
      console.error('Error approving testimonial:', error);
      setTimeout(() => setError(''), 5000);
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
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to reject testimonial');
      console.error('Error rejecting testimonial:', error);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      await testimonialsAPI.updateFeatured(id, !currentFeatured);
      setSuccess(`Testimonial ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to update featured status');
      console.error('Error updating featured status:', error);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleToggleVisibility = async (id, currentVisible) => {
    if (!confirm(`Are you sure you want to ${currentVisible ? 'hide' : 'show'} this testimonial?`)) {
      return;
    }

    try {
      await testimonialsAPI.updateVisibility(id, !currentVisible);
      setSuccess(`Testimonial ${!currentVisible ? 'shown' : 'hidden'} successfully`);
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to update visibility');
      console.error('Error updating visibility:', error);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }

    try {
      await testimonialsAPI.delete(id);
      setSuccess('Testimonial deleted successfully');
      loadData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to delete testimonial');
      console.error('Error deleting testimonial:', error);
      setTimeout(() => setError(''), 5000);
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

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimonial Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Review, approve, and manage customer testimonials
          </p>
        </div>
        <Button onClick={loadData} variant="secondary" className="w-fit">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingTestimonials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allTestimonials.filter(t => t.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Star className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allTestimonials.filter(t => t.is_featured).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{allTestimonials.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning-600" />
            Pending Testimonials ({pendingTestimonials.length})
          </CardTitle>
          <CardDescription>
            Review and approve testimonials before they appear publicly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingTestimonials.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">All caught up!</h3>
              <p className="mt-2 text-sm text-gray-500">No testimonials pending review.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingTestimonials.map((testimonial) => (
                <div key={testimonial.id} className="border border-warning-200 rounded-lg p-6 bg-warning-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{testimonial.full_name}</h3>
                          <p className="text-sm text-gray-600">{testimonial.email}</p>
                        </div>
                        <Badge variant="secondary">{testimonial.source_type}</Badge>
                      </div>
                      
                      <StarRating rating={testimonial.star_rating} className="mb-3" />
                      
                      <blockquote className="text-gray-700 italic border-l-4 border-gray-300 pl-4 mb-4">
                        "{testimonial.testimonial_text}"
                      </blockquote>
                      
                      <p className="text-sm text-gray-500">
                        Submitted: {formatDate(testimonial.submitted_at)}
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleApprove(testimonial.id)}
                        variant="success"
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(testimonial.id)}
                        variant="danger"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Testimonials */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Testimonials ({allTestimonials.length})</CardTitle>
              <CardDescription>
                Manage all testimonials including approved and rejected ones
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search testimonials..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTestimonials.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No testimonials found</h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'No testimonials have been submitted yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{testimonial.full_name}</h3>
                            <StarRating rating={testimonial.star_rating} size="sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{testimonial.source_type}</Badge>
                            {testimonial.is_featured && (
                              <Badge variant="warning">Featured</Badge>
                            )}
                            {testimonial.status === 'approved' && (
                              <Badge variant={testimonial.is_visible ? "success" : "secondary"}>
                                {testimonial.is_visible ? "Visible" : "Hidden"}
                              </Badge>
                            )}
                            {getStatusBadge(testimonial.status)}
                          </div>
                        </div>
                        
                        <blockquote className="text-gray-700 mb-4">
                          "{testimonial.testimonial_text}"
                        </blockquote>
                        
                        <p className="text-sm text-gray-500">
                          {testimonial.approved_at 
                            ? `Approved: ${formatDate(testimonial.approved_at)}`
                            : `Submitted: ${formatDate(testimonial.submitted_at)}`
                          }
                        </p>
                      </div>
                      
                      {testimonial.status === 'approved' && (
                        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => handleToggleFeatured(testimonial.id, testimonial.is_featured)}
                            variant={testimonial.is_featured ? "warning" : "secondary"}
                            size="sm"
                          >
                            <Star className="h-4 w-4" />
                            {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                          </Button>
                          <Button
                            onClick={() => handleToggleVisibility(testimonial.id, testimonial.is_visible)}
                            variant={testimonial.is_visible ? "secondary" : "success"}
                            size="sm"
                          >
                            {testimonial.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {testimonial.is_visible ? 'Hide' : 'Show'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(testimonial.id)}
                            variant="danger"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                      
                      {(testimonial.status === 'pending' || testimonial.status === 'rejected') && (
                        <div className="flex-shrink-0">
                          <Button
                            onClick={() => handleDelete(testimonial.id)}
                            variant="danger"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredTestimonials.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredTestimonials.length}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="secondary"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="secondary"
                      size="sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Testimonials;