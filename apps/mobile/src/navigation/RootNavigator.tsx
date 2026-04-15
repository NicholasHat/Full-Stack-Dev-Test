import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';

import { appColors } from '../theme/uiStyles';

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

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: appColors.link,
    background: appColors.bg,
    card: appColors.canvas,
    text: appColors.text,
    border: appColors.border,
    notification: appColors.danger,
  },
};

function tabIconName(routeName: string, focused: boolean) {
  switch (routeName) {
    case 'Estimates':
      return focused ? 'file-document' : 'file-document-outline';
    case 'Jobs':
      return focused ? 'briefcase' : 'briefcase-outline';
    case 'Customers':
      return focused ? 'account-group' : 'account-group-outline';
    default:
      return focused ? 'circle' : 'circle-outline';
  }
}

function TabsNavigator() {
  return (
    <Tabs.Navigator
      initialRouteName="Estimates"
      screenOptions={({ route }) => ({
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: appColors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { color: appColors.text, fontWeight: '600' },
        headerTintColor: appColors.text,
        tabBarActiveTintColor: appColors.link,
        tabBarInactiveTintColor: appColors.muted,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(22,27,34,0.92)',
          borderTopColor: appColors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Icon source={tabIconName(route.name, focused)} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="Estimates" component={EstimateHistoryScreen} />
      <Tabs.Screen name="Jobs" component={JobsScreen} />
      <Tabs.Screen name="Customers" component={CustomersScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: appColors.bg },
          headerTintColor: appColors.text,
          headerTitleStyle: { color: appColors.text, fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: appColors.bg },
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="CustomerEdit" component={CustomerEditScreen} />
        <Stack.Screen name="JobEdit" component={JobEditScreen} />
        <Stack.Screen name="EstimateBuilder" component={EstimateBuilderScreen} />
        <Stack.Screen name="EstimateReview" component={EstimateReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
