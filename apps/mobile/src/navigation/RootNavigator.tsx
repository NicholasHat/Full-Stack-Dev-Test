import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomersScreen } from '../screens/CustomersScreen';
import { CustomerEditScreen } from '../screens/CustomerEditScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { JobEditScreen } from '../screens/JobEditScreen';
import { EstimateBuilderScreen } from '../screens/EstimateBuilderScreen';
import { EstimateHistoryScreen } from '../screens/EstimateHistoryScreen';
import { EstimateReviewScreen } from '../screens/EstimateReviewScreen';

// Define the types for the navigation stack
export type RootStackParamList = {
  Tabs: undefined;
  CustomerEdit: { customerId?: string } | undefined;
  JobEdit: { jobId?: string } | undefined;
  EstimateBuilder:
    | { jobId?: string; customerId?: string; estimateId?: string; draftId?: string; copyFromEstimateId?: string }
    | undefined;
  EstimateReview: { estimateId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function TabsNavigator() {
  return (
    <Tabs.Navigator initialRouteName="Estimates">
      <Tabs.Screen name="Estimates" component={EstimateHistoryScreen} />
      <Tabs.Screen name="Jobs" component={JobsScreen} />
      <Tabs.Screen name="Customers" component={CustomersScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="CustomerEdit" component={CustomerEditScreen} />
        <Stack.Screen name="JobEdit" component={JobEditScreen} />
        <Stack.Screen name="EstimateBuilder" component={EstimateBuilderScreen} />
        <Stack.Screen name="EstimateReview" component={EstimateReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
