# content/urls.py
from django.urls import path, include
from django.conf.urls.static import static
from . import views
from .views import (
    BlogListAPIView,
    BlogDetailAPIView,
    BlogCreateAPIView,
    OrderDetailAPIView # NEW: Import OrderDetailAPIView
)
from django.conf import settings
from rest_framework.authtoken import views as auth_views # Import for default DRF login

urlpatterns = [

    path('', views.home_page, name = 'home_page'),
    path('data/', views.showdata, name = 'alldata'),
    path('qr/', views.showQR, name = 'QR_code'),
    path('shop/', views.shop_page, name = 'shop_page'),
    path('about/', views.about_page, name='about_page'),
    path('profile/', views.profile_page, name='profile_page'),
    path('contact/', views.contact_page, name='contact_page'),
    path('blog/', views.blog_page, name='blog_page'),
    path('blogDetails/', views.blogDetails_page, name='blogDetails_page'),
    path('api/category-products/<int:pk>/', views.product_by_category_api, name='product_by_category_api'),
    path('test-token/', views.token_test_page, name='test_token_page'),

     
    path('payment-successful/', views.payment_successful_page, name='payment_successful_page'),
    path('product/<int:pk>/', views.product_detail_page, name='product_detail_page'),
    path('cart/', views.cart_page, name='cart_page'),
    path('sale-history/', views.sale_history_page, name='sale_history_page'),
    path('payment/', views.payment_page, name='payment_page'), 
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('profile/upload_picture/', views.upload_profile_picture, name='upload_profile_picture'),
    path('profile/update_details/', views.update_profile_details, name='update_profile_details'),
    path('order/<int:order_id>/details/', views.order_details_page, name='order_details_page'), # NEW: URL for order details page

    path('api/products/', views.product_list_api, name='product_list_api'),
    path('api/products/<int:pk>/', views.ProductDetailAPIView.as_view(), name='product_detail_api'),
    path('api/products/add/', views.AddProductAPIView.as_view(), name='add_product_api'),
    path('api/protected/', views.protected_api_view, name='protected_api_view'),
  
    
    path('api/categories/', views.CategoryListAPIView.as_view(), name='category_list_api'),

    path('api/cart/add/', views.AddToCartAPIView.as_view(), name='add_to_cart_api'),
    path('api/cart/', views.CartDetailAPIView.as_view(), name='cart_detail_api'),
    path('api/order/place/', views.PlaceOrderAPIView.as_view(), name='place_order_api'),
    path('api/cart/update/', views.UpdateCartItemAPIView.as_view(), name='update_cart_item_api'),
    path('api/blogs/', BlogListAPIView.as_view(), name='blog_list_api'),
    path('api/blogs/<int:pk>/', BlogDetailAPIView.as_view(), name='blog_detail_api'),
    path('api/blogs/add/', BlogCreateAPIView.as_view(), name='blog_create_api'), 
   
    path('api/order/place/', views.PlaceOrderAPIView.as_view(), name='place_order_api'),
    path('api/sales/', views.SaleLogListAPIView.as_view(), name='sale_log_list_api'),
    path('api/orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order_detail_api'), # NEW: URL for single order API

    path('api/auth/token/', views.CustomAuthToken.as_view(), name='api_token_auth'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')), # Add this to root urls.py as well

]+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)