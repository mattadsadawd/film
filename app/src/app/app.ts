import { Component, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy {
  private API_KEY = '6577ab89';
  private DEFAULT_IDS = [
    'tt3896198', 'tt0111161', 'tt1375666', 'tt0133093', 'tt4154796', 'tt0110912', 'tt0068646',
    'tt0109830', 'tt0114369', 'tt0120737', 'tt0167260', 'tt0080684', 'tt0137523', 'tt6751668',
    'tt0102926', 'tt0848228', 'tt0816692', 'tt4154756', 'tt4633694', 'tt0120815', 'tt0468569',
    'tt1853728', 'tt0266543', 'tt0088763', 'tt0172495'
  ];

  movies = signal<any[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  searchResults = signal<any[]>([]);
  genreFilter = signal('Tutti');
  showScrollTop = signal(false);
  private _onScroll: () => void;
  
  allMovies = computed(() => 
    this.searchResults().length > 0 ? this.searchResults() : this.movies()
  );

  allGenres = computed(() => {
    const all = this.allMovies();
    const genres = new Set<string>();
    genres.add('Tutti');
    all.forEach((m: any) => {
      if (m.Genre) {
        m.Genre.split(', ').forEach((g: string) => genres.add(g));
      }
    });
    return Array.from(genres);
  });

  constructor() {
    this.fetchMovies();
    this._onScroll = () => {
      this.showScrollTop.set(typeof window !== 'undefined' ? window.scrollY > 300 : false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this._onScroll, { passive: true });
      // initialize
      this._onScroll();
    }
  }
  
  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this._onScroll as EventListener);
    }
  }

  async fetchMovies() {
    this.loading.set(true);
    try {
      const responses = await Promise.all(
        this.DEFAULT_IDS.map(id => 
          fetch(`https://www.omdbapi.com/?i=${id}&apikey=${this.API_KEY}`).then(r => r.json())
        )
      );
      const valid = responses.filter(r => r.Response !== 'False');
      this.movies.set(valid);
      this.error.set(null);
    } catch (err) {
      this.error.set('Errore durante il caricamento dei film.');
    } finally {
      this.loading.set(false);
    }
  }

  async handleSearch(e: Event) {
    e.preventDefault();
    if (!this.searchTerm().trim()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(this.searchTerm())}&apikey=${this.API_KEY}`);
      const data = await res.json();
      if (data.Response === 'True') {
        const detailed = await Promise.all(
          data.Search.slice(0, 10).map((m: any) => 
            fetch(`https://www.omdbapi.com/?i=${m.imdbID}&apikey=${this.API_KEY}`).then(r => r.json())
          )
        );
        this.searchResults.set(detailed.filter(r => r.Response !== 'False'));
      } else {
        this.searchResults.set([]);
        this.error.set('Nessun risultato trovato.');
      }
    } catch (err) {
      this.error.set('Errore durante la ricerca.');
      console.error('Errore ricerca:', err);
    } finally {
      this.loading.set(false);
    }
  }

  filteredMovies = computed(() => {
    const all = this.allMovies();
    const filter = this.genreFilter();
    if (filter === 'Tutti') return all;
    return all.filter(m => m.Genre && m.Genre.includes(filter));
  });

  scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goHome() {
    // Reset search and filters to initial home state
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.genreFilter.set('Tutti');
    this.error.set(null);
    this.scrollToTop();
  }
}
