import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { auth } from 'firebase/app';
import { Router } from '@angular/router';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { mergeMapTo } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  private profileCollection: AngularFirestoreCollection<any>;
  public isLoading = false;

  constructor(
    public afAuth: AngularFireAuth, private router: Router,
    private afs: AngularFirestore, private afMessaging: AngularFireMessaging
  ) {
    this.profileCollection = afs.collection<any>('profile');
  }

  ngOnInit() {
  }

  login() {
    this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider())
      .then((res: firebase.auth.UserCredential) => {
        // navigate to chat page
        console.log(res.user);
        this.isLoading = true;

        this.afMessaging.requestToken
          .subscribe(
            (token) => {
              this.saveProfile(res, token);
              console.log('Permission granted! Save to the server!', token);
            },
            (error) => {
              this.saveProfile(res, null);
              console.error(error);
            },
          );
      }).catch((err) => {
        console.log(err);
      });
  }

  private saveProfile(res, cToken): void {
    this.profileCollection.doc(res.user.uid).set({
      email: res.user.email,
      displayName: res.user.displayName,
      online: true,
      photoURL: res.user.photoURL,
      token: cToken
    }).then(() => {
      this.router.navigate(['/chat']);
      this.isLoading = false;
    }).catch((err) => {
      this.isLoading = false;
      console.log(err);
    });
  }
}
