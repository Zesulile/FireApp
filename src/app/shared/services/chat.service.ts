import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { timeout, map, reduce, find, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(public http: HttpClient) { }

  public updateRead(body: any): Observable<any> {
    const requestHeaders = this.createRequestHeader();
    return this.http.post<any>(`https://us-central1-firechat-14ad7.cloudfunctions.net/updateRead`, body,
      { headers: requestHeaders })
      .pipe(timeout(45000));
  }


  private createRequestHeader() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return headers;
  }
}
