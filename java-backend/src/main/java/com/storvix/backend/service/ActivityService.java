package com.storvix.backend.service;

import com.storvix.backend.entity.Activity;
import com.storvix.backend.entity.User;
import com.storvix.backend.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivity(User user, String action, String resourceType, String resourceId) {
        Activity activity = new Activity();
        activity.setUser(user);
        activity.setAction(action);
        activity.setResourceType(resourceType);
        activity.setResourceId(resourceId);
        activityRepository.save(activity);
    }
}
