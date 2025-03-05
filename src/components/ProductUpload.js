import React, { useState, useEffect, useCallback } from 'react';
import { addDoc, collection, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuthContext } from '../hooks/useAuthContext';
import './ProductUpload.css';

const ProductUpload = ({ selectedShop, shops, onShopSelect }) => {
  const { firebaseUser } = useAuthContext();
  const [products, setProducts] = useState([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    imageFile: null
  });
  
  const [previewImage, setPreviewImage] = useState('');
  
  // Wrap fetchProducts in useCallback to prevent unnecessary re-creation
  const fetchProducts = useCallback(async () => {
    if (!selectedShop) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const productsQuery = query(
        collection(db, 'products'),
        where('shopId', '==', selectedShop.id)
      );
      
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [selectedShop]); // Include selectedShop as a dependency
  
  useEffect(() => {
    if (selectedShop) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [selectedShop, fetchProducts]); // Now include fetchProducts in the dependencies
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFormData({
      ...formData,
      imageFile: file
    });
    
    // Create preview URL
    const previewURL = URL.createObjectURL(file);
    setPreviewImage(previewURL);
  };
  
  const resetForm = () => {
    setFormData({
      productName: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
      imageFile: null
    });
    setPreviewImage('');
    setError('');
    setSuccessMessage('');
  };
  
  const handleAddProduct = () => {
    setIsAddingProduct(true);
    setIsEditingProduct(false);
    setCurrentProduct(null);
    resetForm();
  };
  
  const handleEditProduct = (product) => {
    setIsEditingProduct(true);
    setIsAddingProduct(false);
    setCurrentProduct(product);
    
    setFormData({
      productName: product.productName,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category: product.category,
      imageFile: null
    });
    
    setPreviewImage(product.imageUrl || '');
  };
  
  const handleCancelForm = () => {
    setIsAddingProduct(false);
    setIsEditingProduct(false);
    setCurrentProduct(null);
    resetForm();
  };
  
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await deleteDoc(doc(db, 'products', productId));
      setSuccessMessage('Product deleted successfully');
      
      // Refresh products list
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedShop) {
      setError('Please select a shop first');
      return;
    }
    
    // Validate form
    if (
      !formData.productName.trim() || 
      !formData.description.trim() || 
      !formData.price || 
      !formData.quantity || 
      !formData.category.trim()
    ) {
      setError('Please fill all required fields');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      let imageUrl = isEditingProduct ? currentProduct.imageUrl : '';
      
      // Upload image if a new one is selected
      if (formData.imageFile) {
        const imageName = `${Date.now()}_${formData.imageFile.name}`;
        const storageRef = ref(storage, `product_images/${imageName}`);
        
        await uploadBytes(storageRef, formData.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      const productData = {
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category.trim(),
        imageUrl,
        shopId: selectedShop.id,
        vendorId: firebaseUser.id,
        createdAt: isEditingProduct ? currentProduct.createdAt : new Date(),
        updatedAt: new Date()
      };
      
      if (isEditingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', currentProduct.id), productData);
        setSuccessMessage('Product updated successfully');
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), productData);
        setSuccessMessage('Product added successfully');
      }
      
      // Reset form and refresh products
      resetForm();
      setIsAddingProduct(false);
      setIsEditingProduct(false);
      setCurrentProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="product-upload-container">
      <div className="product-header">
        <h2>Product Management</h2>
        {!shops.length ? (
          <div className="no-shop-message">
            <p>You need to create a shop before adding products</p>
          </div>
        ) : !selectedShop ? (
          <div className="no-shop-selected">
            <p>Please select a shop to manage products</p>
            <div className="shop-selector">
              {shops.map(shop => (
                <button 
                  key={shop.id} 
                  className="shop-select-btn"
                  onClick={() => onShopSelect(shop)}
                >
                  {shop.shopName}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="selected-shop-info">
              <p>Managing products for: <strong>{selectedShop.shopName}</strong></p>
              {!isAddingProduct && !isEditingProduct && (
                <button onClick={handleAddProduct} className="add-product-btn">
                  Add New Product
                </button>
              )}
            </div>
            
            {(isAddingProduct || isEditingProduct) && (
              <div className="product-form-container">
                <h3>{isEditingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}
                
                <form onSubmit={handleSubmit} className="product-form">
                  <div className="form-group">
                    <label htmlFor="productName">Product Name</label>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">Price ($)</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="quantity">Quantity</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        step="1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="productImage">Product Image</label>
                    <input
                      type="file"
                      id="productImage"
                      name="productImage"
                      onChange={handleImageChange}
                      accept="image/*"
                      className="file-input"
                    />
                    {previewImage && (
                      <div className="image-preview">
                        <img src={previewImage} alt="Product preview" />
                      </div>
                    )}
                  </div>
                  
                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={isLoading}>
                      {isLoading ? 'Saving...' : isEditingProduct ? 'Update Product' : 'Add Product'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCancelForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {!isAddingProduct && !isEditingProduct && (
              <div className="products-list-container">
                <h3>Your Products</h3>
                
                {isLoading ? (
                  <div className="loading-message">Loading products...</div>
                ) : error ? (
                  <div className="error-message">{error}</div>
                ) : products.length === 0 ? (
                  <div className="no-products-message">
                    <p>You haven't added any products yet.</p>
                  </div>
                ) : (
                  <div className="products-grid">
                    {products.map(product => (
                      <div key={product.id} className="product-card">
                        <div className="product-image">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.productName} />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                        <div className="product-details">
                          <h4>{product.productName}</h4>
                          <p className="product-price">${product.price.toFixed(2)}</p>
                          <p className="product-stock">In stock: {product.quantity}</p>
                        </div>
                        <div className="product-actions">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="edit-product-btn"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="delete-product-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductUpload;