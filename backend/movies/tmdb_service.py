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
    """Get full details for a single movie, including cast and trailer."""
    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    params = {"append_to_response": "credits,videos"}
    response = requests.get(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()


def extract_cast_and_trailer(data):
    """Pull top 6 cast names and a YouTube trailer key from a TMDB details response."""
    cast_list = data.get('credits', {}).get('cast', [])[:6]
    cast = ', '.join([c['name'] for c in cast_list])

    trailer_key = ''
    for v in data.get('videos', {}).get('results', []):
        if v.get('type') == 'Trailer' and v.get('site') == 'YouTube':
            trailer_key = v['key']
            break
    return cast, trailer_key