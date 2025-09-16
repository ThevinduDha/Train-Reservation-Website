package lk.sliit.lankarail.impl;

import lk.sliit.lankarail.model.Route;
import lk.sliit.lankarail.repository.RouteRepository;
import lk.sliit.lankarail.service.RouteService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RouteServiceImpl implements RouteService {

    private final RouteRepository repo;

    public RouteServiceImpl(RouteRepository repo) {
        this.repo = repo;
    }

    @Override
    public Route create(Route route) {
        return repo.save(route);
    }

    @Override
    public Route findById(Long id) {
        return repo.findById(id).orElseThrow(() -> new RuntimeException("Route not found: " + id));
    }

    @Override
    public List<Route> findAll() {
        return repo.findAll();
    }

    @Override
    public Route update(Long id, Route route) {
        Route existing = findById(id);
        if (route.getName() != null) existing.setName(route.getName());
        if (route.getOrigin() != null) existing.setOrigin(route.getOrigin());
        if (route.getDestination() != null) existing.setDestination(route.getDestination());
        if (route.getDistanceKm() != null) existing.setDistanceKm(route.getDistanceKm());
        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
