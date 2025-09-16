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
        // basic validation is handled by @Valid on controller for POST
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

    /**
     * Partial-update friendly: only non-null fields from `route` are applied.
     * For any provided field we validate (not blank or positive).
     */
    @Override
    public Route update(Long id, Route route) {
        Route existing = findById(id);

        // name (if provided must not be blank)
        if (route.getName() != null) {
            if (route.getName().isBlank()) {
                throw new RuntimeException("name: Route name is required");
            }
            existing.setName(route.getName());
        }

        // origin (if provided must not be blank)
        if (route.getOrigin() != null) {
            if (route.getOrigin().isBlank()) {
                throw new RuntimeException("origin: Origin station is required");
            }
            existing.setOrigin(route.getOrigin());
        }

        // destination (if provided must not be blank)
        if (route.getDestination() != null) {
            if (route.getDestination().isBlank()) {
                throw new RuntimeException("destination: Destination station is required");
            }
            existing.setDestination(route.getDestination());
        }

        // distanceKm (if provided must be > 0)
        if (route.getDistanceKm() != null) {
            if (route.getDistanceKm() <= 0) {
                throw new RuntimeException("distanceKm: Distance must be positive");
            }
            existing.setDistanceKm(route.getDistanceKm());
        }

        return repo.save(existing);
    }

    @Override
    public void delete(Long id) {
        repo.deleteById(id);
    }
}
