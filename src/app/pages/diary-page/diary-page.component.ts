// Angular
import { Component } from '@angular/core';

// Components
import { RecordCardComponent } from '../../components/record-card/record-card.component';

@Component({
  selector: 'app-diary-page',
  imports: [RecordCardComponent],
  templateUrl: './diary-page.component.html',
  styleUrl: './diary-page.component.scss'
})
export class DiaryPageComponent {

}
