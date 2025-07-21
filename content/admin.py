# In content/admin.py
from django.contrib import admin
# Make sure to import all your models
from .models import Data, QR, Product, Category, Cart, CartItem, Order, OrderItem, SaleLog, Blog

# Register your models here
admin.site.register(Data)
admin.site.register(QR)
admin.site.register(Category) # Register the new Category model
admin.site.register(Product)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(SaleLog) 
admin.site.register(Blog)