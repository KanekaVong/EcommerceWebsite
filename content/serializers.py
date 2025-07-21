# content/serializers.py
from rest_framework import serializers
from .models import Product, Category, Cart, CartItem, Order, OrderItem, SaleLog, Blog, Data # Import Data model
from django.contrib.auth.models import User

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'category_name', 'image', 'description', 'stock', 'is_featured']
 
class SaleLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    product_name = serializers.ReadOnlyField(source='product.name')
    order_id = serializers.ReadOnlyField(source='order.id') # Ensure this links to the Order ID

    class Meta:
        model = SaleLog
        fields = ['id', 'user', 'user_email', 'product', 'product_name', 'quantity', 'sale_price', 'sale_date', 'order', 'order_id']

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')
    product_image = serializers.ReadOnlyField(source='product.image') # Include product image

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_price', 'product_image', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'session_key', 'created_at', 'updated_at', 'items']

class AddToCartSerializer(serializers.ModelSerializer):
    cart = serializers.PrimaryKeyRelatedField(queryset=Cart.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1)

    class Meta:
        model = CartItem
        fields = ['cart', 'product', 'quantity']

class BlogSerializer(serializers.ModelSerializer):
    class Meta:
        model = Blog
        fields = ['id', 'title', 'content', 'image', 'created_at']
        read_only_fields = ['created_at']

# MODIFIED: OrderItemSerializer to include product_image
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.ReadOnlyField(source='product.image') # NEW: Include product image

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_order', 'product_image'] # Added product_image

# MODIFIED: OrderSerializer to include nested OrderItems, user_username, and status_display
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True) # Nested serializer for order items
    user_username = serializers.ReadOnlyField(source='user.username') # Changed from user_email to user_username
    status_display = serializers.CharField(source='get_status_display', read_only=True) # For human-readable status

    class Meta:
        model = Order
        fields = ['id', 'user', 'user_username', 'created_at', 'updated_at', 'status', 'status_display', 'total_amount', 'items'] # Added user_username, status_display

class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price_at_order']

class PlaceOrderSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True)
    
    class Meta:
        model = Order
        fields = ['user', 'status', 'total_amount', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

# NEW: UserProfileSerializer (assuming you have a Data model linked to User)
class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Data
        fields = ['firstname', 'lastname', 'email', 'username', 'profile']