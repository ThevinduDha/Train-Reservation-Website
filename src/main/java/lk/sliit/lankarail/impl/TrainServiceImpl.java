package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.Train;
import lk.sliit.lankarail.repository.TrainRepository;
import lk.sliit.lankarail.service.TrainService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TrainServiceImpl implements TrainService {

    private final TrainRepository repo;

    public TrainServiceImpl(TrainRepository repo) {
        this.repo = repo;
    }

    @Override
    public Train create(Train train) {
        return repo.save(train);
    }

    @Override
    public Train findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Train not found: " + id));
    }

    @Override
    public List<Train> findAll() {
        return repo.findAll();
    }

    @Override
    public Train update(Long id, Train train) {
        Train existing = findById(id);
        if (train.getName() != null) existing.setName(train.getName());
        if (train.getType() != null) existing.setType(train.getType());
        if (train.getCapacity() != null) existing.setCapacity(train.getCapacity());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
