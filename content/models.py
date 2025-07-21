# content/models.py
from django.db import models
from django.contrib.auth.models import User # Import User model

class Data(models.Model):
    # This line creates a one-to-one link between a user and their profile data.
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    
    firstname = models.CharField(max_length = 125)
    lastname = models.CharField(max_length = 125)
    email = models.CharField(max_length = 125)
    profile = models.ImageField(upload_to='profiles/', blank=True, null=True) # Changed to ImageField
    date_created = models.DateField(auto_now_add = True)

    def __str__(self):
        return f"Profile for {self.user.username}"

class QR(models.Model):
    name = models.CharField(max_length = 125)
    img_url = models.CharField(max_length = 255)

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories" # Correct plural name in admin

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=7, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products') # Link to Category
    image = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True) # Added description field
    stock = models.PositiveIntegerField(default=0) # Added stock field
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_featured = models.BooleanField(default=False, help_text="Designates whether this product should be displayed on the homepage.")


    def __str__(self):
        return self.name

# Shopping Cart Models
class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True, unique=True) # For unauthenticated users
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.user:
            return f"Cart of {self.user.username}"
        return f"Anonymous Cart {self.session_key or self.id}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product') # Ensures one entry per product per cart

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in cart {self.cart.id}"

# Order Models
class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True) # Allow anonymous orders if needed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Order {self.id} by {self.user.username if self.user else 'Anonymous'}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_at_order = models.DecimalField(max_digits=7, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for Order {self.order.id}"

class Blog(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to='blogs/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# New SaleLog Model
class SaleLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_date = models.DateTimeField(auto_now_add=True)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='sale_logs') # Link to Order

    def __str__(self):
        return f"Sale of {self.quantity} x {self.product.name} to {self.user.username if self.user else 'Anonymous'} on {self.sale_date.strftime('%Y-%m-%d')}"