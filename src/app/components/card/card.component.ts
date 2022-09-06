import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent implements OnInit {

  price
  constructor(price: number)  { 
    this.price = price
  }

  ngOnInit() {
    console.log(this.price)
  }

}
