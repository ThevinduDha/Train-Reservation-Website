package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.Schedule;

import java.util.List;

public interface ScheduleService {
    Schedule create(Schedule schedule);
    Schedule findById(Long id);
    List<Schedule> findAll();
    Schedule update(Long id, Schedule schedule);
    void delete(Long id);
}
