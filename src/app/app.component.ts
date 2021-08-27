import { Component, ViewChild } from '@angular/core';
import { NgxCsvParser } from 'ngx-csv-parser';
import { NgxCSVParserError } from 'ngx-csv-parser';
import * as Color from 'color';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: []
})
export class AppComponent {

  data;
  selectedBoss;
  justThisBoss;
  hideAll: boolean = false;
  files: File[] = [];
  csvRecords: any[] = [];
  bosses: any[] = [];
  users: any[] = [];
  accounts: any[] = [];
  mechanics: any[] = [];
  header = true;
  colors = [];
  options: any;

  constructor(private ngxCsvParser: NgxCsvParser) {

    this.colors.push(Color('rgba(216,167,177)'))
    this.colors.push(Color('rgba(182,226,211)'))
    this.colors.push(Color('rgba(180,243,189)'))
    this.colors.push(Color('rgba(239,124,142)'))
    this.colors.push(Color('rgba(136,123,176)'))
    this.colors.push(Color('rgba(133,210,208)'))
    this.colors.push(Color('rgba(244,185,184)'))
    this.colors.push(Color('rgba(233,137,128)'))
    this.colors.push(Color('rgba(212,140,112)'))
    this.colors.push(Color('rgba(41,160,177)'))

    this.options = {
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
        display:true,
        labels: {
            fontSize: 14,
        }
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
  },
  };
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
    this.data = undefined;
    this.selectedBoss = undefined;
  }

  toggleVisibility(e) {
    this.hideAll = e.checked;
    this.plotChart()
  }

  onSelect(event) {
    this.files = event.addedFiles;
    this.clearData();
    this.fileChangeListener();
  }
  
  onRemove() {
    this.files = [];
    this.clearData();
  }

  fileChangeListener(): void {

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
      if(row["Mechanic Name"] === mechanic && row["Failed"])
      isImportant = true;
    })
    return isImportant;
  }

  getMechanicsForBoss(bossName: any) {
    let distincts = new Set();
    this.csvRecords.forEach(row => {
      if (row["Boss Name"] === bossName) {
        distincts.add(row["Mechanic Name"]);
      }
        
    })
    distincts.forEach(mechanic => {
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
    this.justThisBoss = filtered;
    let mechanics = this.getMechanicsForBoss(this.selectedBoss)
    this.prepareDataForChart(mechanics, filtered)
  }

  prepareDataForChart(mechanics : any[], records: any[]) {
    let users = this.getDistinctValuesByHeader(records, "Account Name");
    let userData = [];
    users.forEach((user, flag) => {
      let userRecords = records.filter(record => record["Account Name"] === user)
      let userMechanic = [];
      mechanics.forEach((mechanic, idx) => {
        userRecords.forEach(record => {
          if(record["Mechanic Name"] === mechanic) {
            userMechanic[idx] = this.collateMechanics(record)
          }
        })
        // setting 0 value for a mechanic if no records found so the radar chart connects dots
        if(userMechanic[idx] === undefined) {
          userMechanic[idx] = 0 
        }
      })
      let color: Color = Color(this.colors[flag])
      userData.push (
        {
          label: user,
          data: userMechanic,
          lineTension: 0.2,
          spanGaps: true,
          backgroundColor: color.fade(0.6),
          borderColor: color.fade(0.5),
          pointBackgroundColor: color.fade(0.2),
          pointBorderColor:color.fade(0.2),
          pointHoverBackgroundColor: color.hsl().string(),
          pointHoverBorderColor: color.hsl().string(),
          pointRadius: 4,
          pointHoverRadius: 6,
          hidden:this.hideAll,
      }
      )
    })
    this.data = {
      labels: mechanics,
      datasets: userData
    }
    // console.log(this.data)
  }
  collateMechanics(record: any) {
    let count = 0;
    count += Number(record["Neutral"]) != undefined ? Number(record["Neutral"]) : 0
    count += Number(record["Failed"]) != undefined ? Number(record["Failed"]) : 0
    return count;
  }
}
