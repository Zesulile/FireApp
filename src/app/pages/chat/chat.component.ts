import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import * as firebase from 'firebase';
import { Router } from '@angular/router';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { ChatService } from 'src/app/shared/services/chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {

  public profile: any;
  public users: Array<any>;
  private tempUsers: Array<any>; // new line
  public isLoading = true;

  public message: string;
  private senderID: string;
  public senderName: string;

  public chats: Array<any>;

  private subscription: any;
  private subscriptionConvos: any;

  constructor(
    private afAuth: AngularFireAuth, private afs: AngularFirestore,
    private router: Router, private afMessaging: AngularFireMessaging, private chatService: ChatService
  ) {
    this.users = new Array<any>();
    this.chats = new Array<any>();
    this.tempUsers = new Array<any>(); // new line
  }

  ngOnInit() {
    this.subscription = this.afAuth.user.subscribe(user => {
      this.afs.collection('profile').snapshotChanges().pipe(map(
        actions => {
          return actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        }
      )).subscribe(profiles => {
        this.profile = profiles.find((profile: any) => profile.email === user.email);
        this.users = profiles.filter((profile: any) => profile.email !== user.email);
        this.tempUsers = [...this.users];
        this.isLoading = false;

      });
    });

    this.afMessaging.messages
      .subscribe((message: any) => {

        const data = message.data;
        if (data.sender !== this.senderID) {
          const sub = this.afs.collection('chats', ref => ref
            .where(`${this.senderID}.participant`, '==', true)
            .where(`${this.profile.id}.participant`, '==', true)
            .where(`${this.senderID}.read`, '==', false))
            .valueChanges().subscribe((res) => {

              const index = this.users.findIndex(user => user.id === data.sender);
              this.users[index].unread = res.length.toString();

              sub.unsubscribe();
            });
        }
      });
  }

  public sendMessage(): void {
    // We will be use to send message to a user base on their user email
    if (!this.message) {
      return;
    }

    const data = {
      from: this.profile.id,
      message: this.message,
      created: firebase.firestore.FieldValue.serverTimestamp()
    };

    this.message = '';

    data[this.profile.id] = {
      participant: true,
      read: true
    };

    data[this.senderID] = {
      participant: true,
      read: false
    };

    this.afs.collection('chats').add(data);
  }

  public getConversations(sender: any): void {
    // We will be use to retrieve conversations between the logged in user and another a user
    if (this.senderID === sender.id) {
      return;
    }

    this.chats = new Array<any>();
    this.senderID = sender.id;
    this.senderName = sender.displayName;

    const index = this.users.findIndex(user => user.id === sender.id);
    this.users[index].unread = null;

    let isValidDate = true;

    this.subscriptionConvos = this.afs.collection('chats', ref => ref
      .where(`${sender.id}.participant`, '==', true)
      .where(`${this.profile.id}.participant`, '==', true))
      .valueChanges().pipe(map(actions => {
        return actions.map((value: any) => {
          const receiver = value.from === this.profile.id;

          if (isValidDate) {
            isValidDate = value.created !== null;
          }

          return {
            ...value,
            picture: receiver ? this.profile.photoURL : sender.photoURL,
            isSender: !receiver,
            created: value.created ? value.created.toDate() : null
          };
        }).sort((a, b) => (b.created as any) - (a.created as any));
      })).subscribe((res: Array<any>) => {

        if (isValidDate) {
          this.chats = [...res];
          this.updateRead();
        } else {
          isValidDate = true;
        }


      }, err => {
        console.log(err);
      });

    // fetch conversations
  }

  private setNotification(): void {
    // We will be use to set a listener to update our unread messages
  }

  private updateRead(): void {
    this.chatService.updateRead({
      sender: this.senderID,
      receiver: this.profile.id
    }).subscribe((res) => {

    });
  }
  public search(arg: any): void {
    const text = arg.target.value;

    const temp = this.tempUsers.reduce((acc, value) => {
      const name = value.displayName;
      if (name.toLowerCase().indexOf(text) !== -1 || !text) {
        acc.push(value);
      }
      return acc;
    }, []);

    this.users = temp;
  }

  public logout(): void {
    this.unsubscribe();
    this.afs.collection('profile').doc(this.profile.id).update({ online: false }).then(() => {
      this.afAuth.auth.signOut().then(() => {
        this.router.navigate(['/login']);
      });
    });
  }

  private unsubscribe(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.subscriptionConvos) {
      this.subscriptionConvos.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.unsubscribe();
  }
}
