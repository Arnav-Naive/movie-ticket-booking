from django.urls import path
from .views import tmdb_search, tmdb_import, MovieListView, MovieDetailView, live_search, auto_import

urlpatterns = [
    path('tmdb/search/', tmdb_search, name='tmdb-search'),
    path('tmdb/import/', tmdb_import, name='tmdb-import'),
    path('live-search/', live_search, name='live-search'),
    path('auto-import/', auto_import, name='auto-import'),
    path('', MovieListView.as_view(), name='movie-list'),
    path('<int:pk>/', MovieDetailView.as_view(), name='movie-detail'),
]