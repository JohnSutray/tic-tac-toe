import { Component, OnInit } from '@angular/core';
import { io } from 'socket.io-client';
import { FormControl } from '@angular/forms';
import { CLIENT_EVENTS, ERRORS, SERVER_EVENTS } from '../events.js';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { EndGameComponent } from 'src/app/end-game/end-game.component';
import { IIsWinner } from 'src/app/end-game/end-game.model';

interface IGame {
  moves: ('x' | 'o')[][];
  hostPlayer: string;
  joinedPlayer: string;
  blockedUser: string;
}

interface IHost {
  hostName: string;
  tags: string[];
}

interface IHostCollection {
  hosts: IHost[];
}

interface IEndGame {
  winner: string;
}

interface IHostGame {
  tags: string[];
}

interface IError {
  message: string;
}

interface IJoinGame {
  hostName: string;
}

interface IMove {
  x: number;
  y: number;
  value: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  game: IGame;
  hosts: IHost[];
  allTags: string[];
  isHosted: boolean;

  readonly URL = 'http://localhost:3000';
  readonly socket = io(this.URL, { autoConnect: false });
  readonly nameControl = new FormControl();
  readonly hostTags: string[] = [];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private readonly dialogService: MatDialog,
  ) {
  }

  private get hostedGame(): IHostGame {
    return { tags: this.hostTags };
  }

  get blocked(): boolean {
    return this.game.blockedUser === this.nameControl.value;
  }

  get otherName(): string {
    return this.game.hostPlayer === this.nameControl.value
      ? this.game.joinedPlayer
      : this.game.hostPlayer;
  }

  ngOnInit(): void {
    this.initializeNickAlreadyUsedHandler();

    this.socket.on(SERVER_EVENTS.GAME_UPDATE, this.setGame);
    this.socket.on(SERVER_EVENTS.UPDATE_HOSTS, this.setHosts);
    this.socket.on(SERVER_EVENTS.WIN, this.endGame);
    this.socket.on(ERRORS.CONNECT_ERROR, this.setErrorMessage);
  }

  connect(): void {
    this.socket.auth = { username: this.nameControl.value };
    this.socket.connect();
  }

  removeHostTag(tag: string): void {
    this.hostTags.splice(this.hostTags.indexOf(tag), 1);
  }

  addHostTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.hostTags.push(value.trim());
    }

    if (input) {
      input.value = '';
    }
  }

  hostGame(): void {
    this.socket.emit(CLIENT_EVENTS.HOST_GAME, this.hostedGame);
    this.isHosted = true;
  }

  stopHostGame(): void {
    this.socket.emit(CLIENT_EVENTS.STOP_HOST);
    this.isHosted = false;
  }

  joinGame(hostName: string): void {
    const game: IJoinGame = { hostName };
    this.socket.emit(CLIENT_EVENTS.JOIN_GAME, game);
  }

  trackByHostname(index: number, host: IHost): string {
    return host.hostName;
  }

  trackByContent(index: number, tag: string): string {
    return tag + index;
  }

  private getAllTags(): string[] {
    const set = new Set<string>();

    this.hosts.map(room => room.tags).forEach(
      tags => tags.forEach(
        tag => set.add(tag),
      ),
    );

    return Array.from(set);
  };

  private endGame = (endGame: IEndGame): void => {
    const isWinner: IIsWinner =  { isWinner: endGame.winner === this.nameControl.value };
    this.dialogService.open(EndGameComponent, {
      data: isWinner,
    }).afterClosed().subscribe(() => this.setGame(null));
  };

  private initializeNickAlreadyUsedHandler(): void {
  }

  private setErrorMessage = (error: IError) => {
    if (error.message === ERRORS.INVALID_USERNAME) {
      this.nameControl.setErrors({ alreadyUsed: true });
    }
  };

  private setGame = (game: IGame): void => {
    this.game = game;
    this.isHosted = false;
  };

  private setHosts = (hosts: IHostCollection): void => {
    this.hosts = hosts.hosts;
    this.allTags = this.getAllTags();
  };

  private get markValue(): string {
    return this.game.hostPlayer === this.nameControl.value
      ? 'x'
      : 'o';
  }

  move(rowIndex: number, cellIndex: number): void {
    const move: IMove = { x: cellIndex, y: rowIndex, value: this.markValue };
    this.socket.emit(CLIENT_EVENTS.MOVE, move);
  }
}
