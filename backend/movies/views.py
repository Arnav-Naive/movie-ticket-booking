from django.shortcuts import render

from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Movie
from .serializers import MovieSerializer
from .tmdb_service import search_movies, get_movie_details, extract_cast_and_trailer


@api_view(['GET'])
@permission_classes([IsAdminUser])
def tmdb_search(request):
    query = request.GET.get('query', '')
    if not query:
        return Response({"error": "query param is required"}, status=400)
    results = search_movies(query)
    return Response(results)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def tmdb_import(request):
    tmdb_id = request.data.get('tmdb_id')
    if not tmdb_id:
        return Response({"error": "tmdb_id is required"}, status=400)

    if Movie.objects.filter(tmdb_id=tmdb_id).exists():
        return Response({"error": "Movie already imported"}, status=400)

    data = get_movie_details(tmdb_id)
    cast, trailer_key = extract_cast_and_trailer(data)

    movie = Movie.objects.create(
        tmdb_id=data['id'],
        title=data['title'],
        overview=data.get('overview', ''),
        poster_path=data.get('poster_path'),
        backdrop_path=data.get('backdrop_path'),
        release_date=data.get('release_date') or None,
        runtime=data.get('runtime'),
        language=data.get('original_language'),
        rating=data.get('vote_average'),
        genre=', '.join([g['name'] for g in data.get('genres', [])]),
        cast=cast,
        trailer_key=trailer_key,
    )
    serializer = MovieSerializer(movie)
    return Response(serializer.data, status=201)


class MovieListView(generics.ListAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [AllowAny]


class MovieDetailView(generics.RetrieveAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([AllowAny])
def live_search(request):
    query = request.GET.get('query', '').strip()
    if len(query) < 2:
        return Response({'local': [], 'remote': []})

    local_matches = Movie.objects.filter(title__icontains=query)
    local_serialized = MovieSerializer(local_matches, many=True).data
    local_tmdb_ids = set(m.tmdb_id for m in local_matches)

    remote_results = []
    try:
        tmdb_results = search_movies(query)
        for r in tmdb_results[:10]:
            if r['id'] in local_tmdb_ids:
                continue
            remote_results.append({
                'tmdb_id': r['id'],
                'title': r.get('title'),
                'poster_path': r.get('poster_path'),
                'release_date': r.get('release_date'),
                'rating': r.get('vote_average'),
            })
    except Exception:
        pass  # TMDB hiccup — still return whatever local results we have

    return Response({'local': local_serialized, 'remote': remote_results})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_import(request):
    tmdb_id = request.data.get('tmdb_id')
    if not tmdb_id:
        return Response({"error": "tmdb_id is required"}, status=400)

    existing = Movie.objects.filter(tmdb_id=tmdb_id).first()
    if existing:
        return Response(MovieSerializer(existing).data)

    data = get_movie_details(tmdb_id)
    cast, trailer_key = extract_cast_and_trailer(data)

    movie = Movie.objects.create(
        tmdb_id=data['id'],
        title=data['title'],
        overview=data.get('overview', ''),
        poster_path=data.get('poster_path'),
        backdrop_path=data.get('backdrop_path'),
        release_date=data.get('release_date') or None,
        runtime=data.get('runtime'),
        language=data.get('original_language'),
        rating=data.get('vote_average'),
        genre=', '.join([g['name'] for g in data.get('genres', [])]),
        cast=cast,
        trailer_key=trailer_key,
    )
    return Response(MovieSerializer(movie).data, status=201)