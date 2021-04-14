import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { FormControl } from '@angular/forms';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'tic-tac-toe';

  readonly URL = 'http://localhost:3000';
  readonly socket = io(this.URL, { autoConnect: false });
  readonly nameControl = new FormControl();

  connect(): void {
    this.socket.auth = { username: this.nameControl.value };
    this.socket.connect();
  }

  private initializeNickAlreadyUsedHandler(): void {
    this.socket.on('connect_error', (err) => {
      if (err.message === 'invalid username') {
        this.nameControl.setErrors({ alreadyUsed: true });
      }
    });
  }

  ngOnInit(): void {
    this.initializeNickAlreadyUsedHandler();
  }
}
