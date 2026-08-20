from django.urls import path
from .views import tmdb_search, tmdb_import, MovieListView, MovieDetailView

urlpatterns = [
    path('tmdb/search/', tmdb_search, name='tmdb-search'),
    path('tmdb/import/', tmdb_import, name='tmdb-import'),
    path('', MovieListView.as_view(), name='movie-list'),
    path('<int:pk>/', MovieDetailView.as_view(), name='movie-detail'),
]