# content/views.py
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.template import loader
from .models import Data, QR, Product, Category, Cart, CartItem, Order, OrderItem, SaleLog, Blog # Import new models
from rest_framework.decorators import api_view, permission_classes # Add permission_classes here
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.sessions.backends.db import SessionStore
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout # Import auth functions
from django.contrib.auth.forms import UserCreationForm # For registration
from django.contrib import messages # For displaying messages
from django.contrib.auth.decorators import login_required # For protecting views
from django.db import transaction
from functools import wraps
from .serializers import (
    BlogSerializer, AddToCartSerializer, PlaceOrderSerializer,
    ProductSerializer, CategorySerializer, SaleLogSerializer,
    CartItemSerializer, CartSerializer, OrderItemSerializer, OrderSerializer, # Ensure OrderItemSerializer and OrderSerializer are imported
    UserProfileSerializer # Import the new UserProfileSerializer
)

VALID_TOKENS = ['VK123', 'CTSPN123', 'CRS123', 'TSH123', 'TPP123', 'MSVMH123']

def token_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        token = request.GET.get('token') or request.headers.get('Authorization')

        if not token:
            return JsonResponse({'error': 'Token is required'}, status=400)

        # Remove "Token " prefix if using Authorization header
        if token.startswith("Token "):
            token = token[6:]

        if token not in VALID_TOKENS:
            return JsonResponse({'error': 'Invalid token'}, status=403)

        return view_func(request, *args, **kwargs)
    return wrapper

class BlogListAPIView(ListAPIView):
    queryset = Blog.objects.all().order_by('-created_at')
    serializer_class = BlogSerializer
    permission_classes = [permissions.AllowAny]

class BlogDetailAPIView(RetrieveAPIView):
    queryset = Blog.objects.all()
    serializer_class = BlogSerializer
    permission_classes = [AllowAny]

class BlogCreateAPIView(generics.CreateAPIView):
    serializer_class = BlogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class AddProductAPIView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  

class AddToCartAPIView(generics.CreateAPIView):
    queryset = CartItem.objects.all()
    serializer_class = AddToCartSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        if not product_id:
            return Response({"error": "Product ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, id=product_id)
        user = request.user if request.user.is_authenticated else None
        session_key = request.session.session_key
        if not session_key:
            request.session.save()
            session_key = request.session.session_key

        cart, created = Cart.objects.get_or_create(
            user=user,
            session_key=session_key if not user else None # If user is authenticated, session_key is not used for lookup
        )

        cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product,
            defaults={'quantity': quantity})
        if not item_created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

class PlaceOrderAPIView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = PlaceOrderSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic # This ensures all database operations are done together, or not at all
    def post(self, request, *args, **kwargs):
        user = request.user
        cart = get_object_or_404(Cart, user=user)

        if not cart.items.exists():
            return Response({"error": "Cart is empty. Cannot place an order."}, status=status.HTTP_400_BAD_REQUEST)

        # --- (NEW) Step 1: Check if there is enough stock for all items ---
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                return Response(
                    {"error": f"Not enough stock for {item.product.name}. Only {item.product.stock} left."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # If stock is sufficient, proceed to create the order
        order = Order.objects.create(user=user)
        total_amount = 0

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price_at_order=item.product.price
            )
            total_amount += item.quantity * item.product.price

            # --- (NEW) Step 2: Decrease the stock for the purchased product ---
            product = item.product
            product.stock -= item.quantity
            product.save()
            # --- End of stock update ---

            # Create SaleLog entry
            SaleLog.objects.create(
                user=user,
                product=product,
                quantity=item.quantity,
                sale_price=product.price,
                order=order
            )

        order.total_amount = total_amount
        order.status = 'completed'
        order.save()

        cart.items.all().delete() # Clear the cart after order is placed

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])


def product_by_category_api(request, pk):
    products = Product.objects.filter(category_id=pk)
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

def token_test_page(request):
    return render(request, 'token_test.html')


def home_page (request):
    products = Product.objects.all()
    return render(request, 'homepage.html', {'products': products})

def contact_page (request):
    return render(request, 'contact.html')

def blog_page (request):
    return render(request, 'blog.html')

def blogDetails_page (request):
    return render(request, 'blogDetails.html')
    
@token_required
def protected_api_view(request):
    """
    Returns product data only if a valid static token is provided.
    """
    products = Product.objects.all().values('id', 'name', 'description', 'price')
    return JsonResponse({
        'message': 'Access granted',
        'products': list(products)
    })


def showdata (request):
    records = Data.objects.all()
    return render(request, 'show_data.html', {'records':records} )

def showQR(request):
    qrs = QR.objects.all()
    return render(request, 'show_qr.html', {'qrs':qrs} )

def shop_page(request):
    products = Product.objects.all()
    return render(request, 'shop_page.html', {'products':products} )
def product_detail_page(request, pk):
    # Fetch the product with the given primary key (pk), or show a 404 page if not found
    product = get_object_or_404(Product, pk=pk)
    
    # You can also fetch related products here if you want to show a "You might also like" section
    # related_products = Product.objects.filter(category=product.category).exclude(pk=pk)[:4]
    
    context = {
        'product': product,
        # 'related_products': related_products
    }
    return render(request, 'product_detail.html', context)

# In content/views.py

def payment_successful_page(request):
    """
    Renders a simple, static 'Payment Successful' confirmation page.
    """
    return render(request, 'payment_successful.html')

def about_page(request):
    return render(request, 'about.html')

@login_required
def profile_page(request):
    # Get the 5 most recent orders for the logged-in user
    recent_orders = Order.objects.filter(user=request.user).order_by('-created_at')[:5]
    
    # Try to get the user's profile data from the Data model
    user_profile_data = None
    try:
        user_profile_data = Data.objects.get(user=request.user)
    except Data.DoesNotExist:
        # If no Data object exists, create one for the user
        user_profile_data = Data.objects.create(user=request.user)
        
    context = {
        'orders': recent_orders,
        'profile_data': user_profile_data,
    }
    # Render the template from the registration folder
    return render(request, 'registration/profile_page.html', context)

# View to handle profile picture uploads (unchanged from previous turn except for popup message removal)
@login_required
def upload_profile_picture(request):
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        if 'profile_picture' in request.FILES:
            user_profile_data, created = Data.objects.get_or_create(user=request.user)
            user_profile_data.profile = request.FILES['profile_picture']
            user_profile_data.save()
            
            if is_ajax:
                return JsonResponse({
                    'success': True, 
                    'message': "Profile picture updated successfully!",
                    'profile_url': user_profile_data.profile.url if user_profile_data.profile else ''
                })
            else:
                messages.success(request, "Profile picture updated successfully!")
                return redirect('profile_page')
        else:
            if is_ajax:
                return JsonResponse({'success': False, 'message': "No image file was uploaded."}, status=400)
            else:
                messages.error(request, "No image file was uploaded.")
                return redirect('profile_page')
    return redirect('profile_page')

# NEW: View to handle updating user details (username, email, first name, last name)
@login_required
def update_profile_details(request):
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        user = request.user
        profile_data, created = Data.objects.get_or_create(user=user)

        # Update User model fields
        updated_username = request.POST.get('username')
        updated_email = request.POST.get('email')
        
        # Update Data model fields
        updated_firstname = request.POST.get('firstname')
        updated_lastname = request.POST.get('lastname')

        errors = []

        # Validate username and email uniqueness if they are changed
        if updated_username and updated_username != user.username:
            if user.__class__.objects.filter(username=updated_username).exists():
                errors.append("This username is already taken.")
            else:
                user.username = updated_username
        
        if updated_email and updated_email != user.email:
            if user.__class__.objects.filter(email=updated_email).exists():
                errors.append("This email is already registered.")
            else:
                user.email = updated_email

        if errors:
            if is_ajax:
                return JsonResponse({'success': False, 'message': "\n".join(errors)}, status=400)
            else:
                for error in errors:
                    messages.error(request, error)
                return redirect('profile_page')
        
        # Save User model changes
        user.save()

        # Save Data model changes
        profile_data.firstname = updated_firstname
        profile_data.lastname = updated_lastname
        profile_data.save()

        if is_ajax:
            return JsonResponse({
                'success': True,
                'message': "Profile details updated successfully!",
                'username': user.username,
                'email': user.email,
                'firstname': profile_data.firstname,
                'lastname': profile_data.lastname,
            })
        else:
            messages.success(request, "Profile details updated successfully!")
            return redirect('profile_page')
    return redirect('profile_page')


# NEW: Page views for Cart, Sale History, Payment, Login, Register
@login_required # Requires user to be logged in
def cart_page(request):
    return render(request, 'cart_page.html')

@login_required
def sale_history_page(request):
    return render(request, 'sale_history_page.html')

@login_required
def payment_page(request):
    return render(request, 'payment_page.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {username}!")
            return redirect('/')
        else:
            messages.error(request, "Invalid username or password.")
    return render(request, 'registration/login.html')

def register_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f"Account created for {user.username}!")
            return redirect('/')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"{field}: {error}")
    else:
        form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})

def logout_view(request):
    logout(request)
    messages.info(request, "You have been logged out.")
    return redirect('login') # Redirect to login page after logout

# API views
@api_view(['GET'])
@permission_classes([AllowAny]) # Products can be viewed by anyone
def product_list_api(request):
    products = Product.objects.all().order_by('name')
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

class ProductDetailAPIView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] # Single product can be viewed by anyone

class CartDetailAPIView(RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [AllowAny] # Cart can be viewed by anyone (anonymous session or authenticated)

    def get_object(self):
        user = self.request.user
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.save()
            session_key = self.request.session.session_key

        if user.is_authenticated:
            # For authenticated users, try to find a cart linked to their user or session
            cart = Cart.objects.filter(user=user).first()
            if not cart and session_key:
                # If no user cart, check if there's an anonymous cart to convert
                anonymous_cart = Cart.objects.filter(session_key=session_key, user__isnull=True).first()
                if anonymous_cart:
                    anonymous_cart.user = user
                    anonymous_cart.session_key = None # Clear session key once linked
                    anonymous_cart.save()
                    cart = anonymous_cart
            if not cart: # If still no cart, create one for the user
                cart = Cart.objects.create(user=user)
        else:
            # For anonymous users, get or create based on session key
            cart, created = Cart.objects.get_or_create(session_key=session_key, user__isnull=True)
        return cart

# NEW: API View for a single Order with nested items
class OrderDetailAPIView(RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can see their orders

    def get_queryset(self):
        # Ensure users can only retrieve their own orders
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset.none() # No orders for unauthenticated users

# New Category List API
class CategoryListAPIView(ListAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny] # Categories are public

# New SaleLog List API (might require authentication for security/privacy)
class SaleLogListAPIView(ListAPIView):
    # Only show sales made by the requesting user, or all for staff
    serializer_class = SaleLogSerializer
    permission_classes = [IsAuthenticated] # Only authenticated users can see sale logs

    def get_queryset(self):
        queryset = SaleLog.objects.all()
        user = self.request.user
        if user.is_authenticated and not user.is_staff: # If not staff, only show their own logs
            queryset = queryset.filter(user=user)
        return queryset.order_by('-sale_date')

# Custom Auth Token (from previous suggestion)
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })
        
class UpdateCartItemAPIView(APIView):
    """
    This view handles updating item quantities or removing items from the cart.
    """
    permission_classes = [AllowAny]

    def get_cart(self, request):
        # Helper function to get the cart for both authenticated and anonymous users
        user = request.user
        if user.is_authenticated:
            # For a logged-in user, get or create their cart
            cart, created = Cart.objects.get_or_create(user=user)
        else:
            # For an anonymous user, use the session key
            session_key = request.session.session_key
            if not session_key:
                request.session.save()
                session_key = request.session.session_key
            cart, created = Cart.objects.get_or_create(session_key=session_key, user__isnull=True)
        return cart

    def post(self, request, *args, **kwargs):
        """
        Handles decrementing an item's quantity.
        """
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({"error": "Product ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        cart = self.get_cart(request)
        product = get_object_or_404(Product, id=product_id)

        try:
            cart_item = CartItem.objects.get(cart=cart, product=product)
            # If quantity is more than 1, decrement it
            if cart_item.quantity > 1:
                cart_item.quantity -= 1
                cart_item.save()
            # If quantity is 1, delete the item from the cart
            else:
                cart_item.delete()
            # Return the updated cart state
            return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            # If the item isn't in the cart, return an error
            return Response({"error": "Item not in cart."}, status=status.HTTP_404_NOT_FOUND)

# NEW: Page view for order details
@login_required
def order_details_page(request, order_id):
    # This view simply renders the HTML template.
    # The actual data fetching will be done by JavaScript on the client side.
    context = {
        'order_id': order_id
    }
    return render(request, 'order_details.html', context)