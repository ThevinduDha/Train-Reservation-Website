package lk.sliit.lankarail.service;

import lk.sliit.lankarail.model.Schedule;

import java.util.List;

import java.time.LocalDate; // Add this import
import java.util.List; // Add this import

// ... inside the interface ...


public interface ScheduleService {
    List<Schedule> searchSchedules(String origin, String destination, LocalDate date);
    Schedule create(Schedule schedule);
    Schedule findById(Long id);
    List<Schedule> findAll();
    Schedule update(Long id, Schedule schedule);
    void delete(Long id);
}
