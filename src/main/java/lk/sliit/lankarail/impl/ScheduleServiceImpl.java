package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.Schedule;
import lk.sliit.lankarail.model.Train;
import lk.sliit.lankarail.repository.ScheduleRepository;
import lk.sliit.lankarail.repository.TrainRepository;
import lk.sliit.lankarail.service.ScheduleService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository repo;
    private final TrainRepository trainRepo;

    public ScheduleServiceImpl(ScheduleRepository repo, TrainRepository trainRepo) {
        this.repo = repo;
        this.trainRepo = trainRepo;
    }

    @Override
    public Schedule create(Schedule schedule) {
        validateBusinessRules(schedule);
        return repo.save(schedule);
    }

    @Override
    public Schedule findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Schedule not found: " + id));
    }

    @Override
    public List<Schedule> findAll() {
        return repo.findAll();
    }

    @Override
    public Schedule update(Long id, Schedule schedule) {
        Schedule existing = findById(id);
        // update fields if provided
        if (schedule.getTrainId() != null) existing.setTrainId(schedule.getTrainId());
        if (schedule.getDepartureStation() != null) existing.setDepartureStation(schedule.getDepartureStation());
        if (schedule.getArrivalStation() != null) existing.setArrivalStation(schedule.getArrivalStation());
        if (schedule.getDepartureTime() != null) existing.setDepartureTime(schedule.getDepartureTime());
        if (schedule.getArrivalTime() != null) existing.setArrivalTime(schedule.getArrivalTime());
        if (schedule.getPrice() != null) existing.setPrice(schedule.getPrice());

        validateBusinessRules(existing);
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }

    private void validateBusinessRules(Schedule s) {
        // train must exist
        Long trainId = s.getTrainId();
        if (trainId == null) {
            throw new RuntimeException("trainId is required");
        }
        Train train = trainRepo.findById(trainId).orElseThrow(() -> new RuntimeException("Train not found: " + trainId));

        // times
        if (s.getDepartureTime() == null || s.getArrivalTime() == null) {
            throw new RuntimeException("Both departureTime and arrivalTime are required");
        }
        if (!s.getDepartureTime().isBefore(s.getArrivalTime())) {
            throw new RuntimeException("departureTime must be before arrivalTime");
        }

        // price
        if (s.getPrice() == null || s.getPrice() <= 0) {
            throw new RuntimeException("price must be greater than 0");
        }
    }
}
