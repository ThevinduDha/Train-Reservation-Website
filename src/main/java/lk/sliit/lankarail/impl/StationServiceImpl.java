package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.Station;
import lk.sliit.lankarail.repository.StationRepository;
import lk.sliit.lankarail.service.StationService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StationServiceImpl implements StationService {

    private final StationRepository repo;

    public StationServiceImpl(StationRepository repo) {
        this.repo = repo;
    }

    @Override
    public Station create(Station station) {
        return repo.save(station);
    }

    @Override
    public Station findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Station not found: " + id));
    }

    @Override
    public List<Station> findAll() {
        return repo.findAll();
    }

    @Override
    public Station update(Long id, Station station) {
        Station existing = findById(id);
        if (station.getName() != null) existing.setName(station.getName());
        if (station.getCity() != null) existing.setCity(station.getCity());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
