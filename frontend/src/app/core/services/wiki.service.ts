import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WikiSearchResult } from '../models/wiki-search.model';

@Injectable({ providedIn: 'root' })
export class WikiService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<WikiSearchResult[]> {
    return this.http.get<WikiSearchResult[]>('${environment.apiUrl}/wiki/search', { params: { q: query } });
  }

  getRandom(): Observable<WikiSearchResult> {
    return this.http.get<WikiSearchResult>('${environment.apiUrl}/wiki/random');
  }
}