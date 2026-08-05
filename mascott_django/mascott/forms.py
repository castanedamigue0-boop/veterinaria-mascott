from django import forms
from django.contrib.auth.models import User
from .models import Cita, Mascota, Producto


# ─── REGISTRO ────────────────────────────────────────────────────────────────
class RegistroForm(forms.Form):
    nombre   = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'placeholder': 'María'}))
    apellido = forms.CharField(max_length=50, widget=forms.TextInput(attrs={'placeholder': 'García'}))
    email    = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'correo@ejemplo.com'}))
    tel      = forms.CharField(max_length=20, required=False, widget=forms.TextInput(attrs={'placeholder': '(55) 1234-5678'}))
    password = forms.CharField(min_length=6, widget=forms.PasswordInput(attrs={'placeholder': 'Mínimo 6 caracteres'}))

    def clean_email(self):
        email = self.cleaned_data['email'].lower()
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Ya existe una cuenta con ese correo.')
        return email


# ─── LOGIN ───────────────────────────────────────────────────────────────────
class LoginForm(forms.Form):
    email    = forms.EmailField(widget=forms.EmailInput(attrs={'placeholder': 'correo@ejemplo.com'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'placeholder': '••••••••'}))


# ─── NUEVA CITA ───────────────────────────────────────────────────────────────
class CitaForm(forms.ModelForm):
    class Meta:
        model  = Cita
        fields = ['mascota', 'servicio', 'fecha', 'hora', 'notas']
        widgets = {
            'mascota': forms.TextInput(attrs={'placeholder': 'Ej. Firulais'}),
            'fecha':   forms.DateInput(attrs={'type': 'date'}),
            'notas':   forms.TextInput(attrs={'placeholder': 'Ej. Traer cartilla'}),
        }


# ─── NUEVA MASCOTA ────────────────────────────────────────────────────────────
class MascotaForm(forms.ModelForm):
    class Meta:
        model  = Mascota
        fields = ['nombre', 'especie', 'raza', 'edad']
        widgets = {
            'nombre': forms.TextInput(attrs={'placeholder': 'Ej. Firulais'}),
            'raza':   forms.TextInput(attrs={'placeholder': 'Ej. Labrador'}),
            'edad':   forms.NumberInput(attrs={'min': 0, 'max': 30, 'placeholder': '3'}),
        }


# ─── PERFIL ───────────────────────────────────────────────────────────────────
class PerfilForm(forms.Form):
    nombre   = forms.CharField(max_length=50)
    apellido = forms.CharField(max_length=50, required=False)
    email    = forms.EmailField()
    password = forms.CharField(min_length=6, required=False, widget=forms.PasswordInput(attrs={'placeholder': 'Dejar vacío para no cambiar'}))


# ─── PRODUCTO (ADMIN) ─────────────────────────────────────────────────────────
class ProductoForm(forms.ModelForm):
    class Meta:
        model  = Producto
        fields = ['nombre', 'marca', 'descripcion', 'precio', 'precio_old', 'animal', 'etapa', 'categoria', 'badge', 'emoji', 'cantidad']
        widgets = {
            'nombre':      forms.TextInput(attrs={'placeholder': 'Ej. Royal Canin Cachorro 3kg'}),
            'marca':       forms.TextInput(attrs={'placeholder': 'Ej. Royal Canin'}),
            'descripcion': forms.Textarea(attrs={'rows': 2}),
            'precio':      forms.NumberInput(attrs={'step': '0.01'}),
            'precio_old':  forms.NumberInput(attrs={'step': '0.01'}),
            'emoji':       forms.TextInput(attrs={'placeholder': '🦴', 'maxlength': '5'}),
        }
