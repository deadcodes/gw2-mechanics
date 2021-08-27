import { Component, ViewChild } from '@angular/core';
import { NgxCsvParser, NgxCSVParserError } from 'ngx-csv-parser';
import { ChartDataSets, ChartType, RadialChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: []
})
export class AppComponent {

  selectedBoss;
  hideAll: boolean = false;
  files: File[] = [];
  csvRecords: any[] = [];
  bosses: any[] = [];
  users: any[] = [];
  accounts: any[] = [];
  mechanics: any[] = [];
  header = true;

  // Radar
  radarChartOptions: RadialChartOptions = {
    responsive: true,
    tooltips: {
      mode: 'point',
    },
    scale: {
      ticks: {
        beginAtZero: true,
      },
      pointLabels: {
        fontSize: 16
      }
    },
    legend: {
      display: true,
      labels: {
        fontSize: 14,
      }
    }
  };

  radarChartLabels: Label[] = [];

  radarChartType: ChartType = 'radar';

  radarChartData: ChartDataSets[] = [
  ];
  constructor(private ngxCsvParser: NgxCsvParser) {
  }

  @ViewChild('fileImportInput', { static: false }) fileImportInput: any;

  getDistinctValuesByHeader(csvData: any[], header: string) {
    let distincts = new Set();
    csvData.forEach(row => {
      distincts.add(row[header]);
    })
    return Array.from(distincts.values());
  }

  clearData() {
    this.csvRecords = [];
    this.bosses = [];
    this.users = [];
    this.accounts = [];
    this.mechanics = [];
    this.selectedBoss = undefined;
  }

  toggleVisibility(e) {
    this.hideAll = e.checked;
    this.plotChart()
  }

  onSelect(event) {
    this.files = event.addedFiles;
    this.clearData();
    this.parseCSV();
  }

  onRemove() {
    this.files = [];
    this.clearData();
  }

  parseCSV(): void {

    const csvFile = this.files[0];
    this.header = (this.header as unknown as string) === 'true' || this.header === true;

    this.ngxCsvParser.parse(csvFile, { header: this.header, delimiter: ',' })
      .pipe().subscribe((result: Array<any>) => {
        this.csvRecords = result;
        this.bosses = this.getDistinctValuesByHeader(result, "Boss Name");
        this.users = this.getDistinctValuesByHeader(result, "Player Name");
        this.accounts = this.getDistinctValuesByHeader(result, "Account Name");
        this.mechanics = this.getDistinctValuesByHeader(result, "Mechanic Name");
      }, (error: NgxCSVParserError) => {
        console.log('Error', error);
      });
  }

  isImportantmechanic(mechanic: any) {
    let isImportant = false;
    this.csvRecords.forEach(row => {
      if (row["Mechanic Name"] === mechanic && row["Failed"])
        isImportant = true;
    })
    return isImportant;
  }

  getMechanicsForBoss(bossName: any): string[] {
    let distincts = new Set<string>();
    this.csvRecords.forEach(row => {
      if (row["Boss Name"] === bossName) {
        distincts.add(row["Mechanic Name"]);
      }
    })
    let categorizedMechanics = [];
    distincts.forEach(mechanic => {
      categorizedMechanics.push({
        name: mechanic,
        isImportant: this.isImportantmechanic(mechanic)
      })
    })
    return Array.from(distincts.values());
  }

  plotChart() {
    let filtered = this.csvRecords.filter(row => row["Boss Name"] === this.selectedBoss)
    let mechanics = this.getMechanicsForBoss(this.selectedBoss)
    this.radarChartLabels = mechanics
    this.prepareDataForChart(mechanics, filtered)
  }

  prepareDataForChart(mechanics: any[], records: any[]) {
    let users = this.getDistinctValuesByHeader(records, "Account Name");
    let userData = [];
    users.forEach((user, flag) => {
      let userRecords = records.filter(record => record["Account Name"] === user)
      let userMechanic = [];
      mechanics.forEach((mechanic, idx) => {
        userRecords.forEach(record => {
          if (record["Mechanic Name"] === mechanic) {
            userMechanic[idx] = this.collateMechanics(record)
          }
        })
        // setting 0 value for a mechanic if no records found so the radar chart connects dots
        if (userMechanic[idx] === undefined) {
          userMechanic[idx] = 0
        }

      })
      userData.push({
        data: userMechanic,
        label: user.toString(),
        lineTension: 0.2,
        spanGaps: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        hidden: this.hideAll
      })
      // {
      //   label: user,
      //   data: userMechanic,
      //   lineTension: 0.2,
      //   spanGaps: true,
      //   backgroundColor: color.fade(0.6),
      //   borderColor: color.fade(0.5),
      //   pointBackgroundColor: color.fade(0.2),
      //   pointBorderColor: color.fade(0.2),
      //   pointHoverBackgroundColor: color.hsl().string(),
      //   pointHoverBorderColor: color.hsl().string(),
      //   pointRadius: 4,
      //   pointHoverRadius: 6,
      //   hidden: this.hideAll,
      // }
    })
    this.radarChartData = userData;
    // console.log(this.data)
  }
  collateMechanics(record: any) {
    let count = 0;
    count += Number(record["Neutral"]) != undefined ? Number(record["Neutral"]) : 0
    count += Number(record["Failed"]) != undefined ? Number(record["Failed"]) : 0
    return count;
  }
}
