import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubtaskList } from './subtask-list';

describe('SubtaskList', () => {
  let component: SubtaskList;
  let fixture: ComponentFixture<SubtaskList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubtaskList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubtaskList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
