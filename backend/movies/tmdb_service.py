import requests
from decouple import config

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_TOKEN = config('TMDB_ACCESS_TOKEN')

HEADERS = {
    "Authorization": f"Bearer {TMDB_TOKEN}",
    "accept": "application/json",
}


def search_movies(query):
    """Search TMDB for movies matching a title."""
    url = f"{TMDB_BASE_URL}/search/movie"
    params = {"query": query}
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()["results"]


def get_movie_details(tmdb_id):
    """Get full details for a single movie by its TMDB id."""
    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()